import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AccountProvider, useAccount } from "@/hooks/useAccount";
import { PreferencesProvider } from "@/hooks/usePreferences";
import { useDataStore } from "@/store/dataStore";
import { AppLayout } from "@/components/layout/AppLayout";
import { SplashScreen } from "@/components/layout/SplashScreen";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import LandingHome from "@/landing/HomePage";
import LandingTerms from "@/landing/TermsPage";
import Journal from "@/pages/Journal";
import CalendarPage from "@/pages/CalendarPage";
import AddTrade from "@/pages/AddTrade";
import EditTrade from "@/pages/EditTrade";
import Analytics from "@/pages/Analytics";
import SettingsPage from "@/pages/SettingsPage";
import BalanceSettings from "@/pages/settings/BalanceSettings";
import GoalsSettings from "@/pages/settings/GoalsSettings";
import CurrencySettings from "@/pages/settings/CurrencySettings";
import PreferencesSettings from "@/pages/settings/PreferencesSettings";
import ProfileSettings from "@/pages/settings/ProfileSettings";
import AccountsSettings from "@/pages/settings/AccountsSettings";
import BillingSettings from "@/pages/settings/BillingSettings";
import AccountSecuritySettings from "@/pages/settings/AccountSecuritySettings";

import TradingRulesSettings from "@/pages/settings/TradingRulesSettings";
import TimeframesSettings from "@/pages/settings/TimeframesSettings";
import DayView from "@/pages/DayView";
import PerformanceCoach from "@/pages/PerformanceCoach";
import EconomicNews from "@/pages/EconomicNews";
import Backtesting from "@/pages/Backtesting";
import Playbook from "@/pages/Playbook";
import Auth from "@/pages/Auth";
import SelectAccount from "@/pages/SelectAccount";
import Paywall from "@/pages/Paywall";

import History from "@/pages/History";
import NotFound from "@/pages/NotFound";

// Check if device is mobile
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
};



const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLayout />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function ProtectedLayout({ onDataReady }: { onDataReady?: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const { activeAccount, accounts, loading: accountLoading } = useAccount();
  const { tradesLoaded, settingsLoaded, setIsHydrating } = useDataStore();
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'active' | 'inactive'>('loading');

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setSubscriptionStatus('inactive');
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data && data.status === 'active') {
          const periodEnd = new Date(data.current_period_end);
          const now = new Date();
          if (periodEnd > now) {
            setSubscriptionStatus('active');
            return;
          }
        }
        setSubscriptionStatus('inactive');
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus('inactive');
      }
    };

    if (!authLoading && user) {
      checkSubscription();
    }
  }, [user, authLoading]);

  // Signal data ready when auth, account, subscription are loaded AND trades are loaded
  // This ensures the splash screen doesn't dismiss until all data is ready
  useEffect(() => {
    if (!authLoading && !accountLoading && activeAccount && subscriptionStatus !== 'loading' && tradesLoaded && settingsLoaded) {
      // Mark hydrating as false immediately so UI renders
      setIsHydrating(false);
      onDataReady?.();
    }
  }, [authLoading, accountLoading, activeAccount, subscriptionStatus, tradesLoaded, settingsLoaded, onDataReady, setIsHydrating]);

  // If auth has resolved and there's no user, redirect immediately
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Avoid blocking the UI with a full-screen loader; the dashboard can render with its own skeletons
  if (authLoading || accountLoading || subscriptionStatus === 'loading') {
    return <AppLayout />;
  }

  // Redirect to paywall if no active subscription
  if (subscriptionStatus === 'inactive') {
    return <Navigate to="/paywall" replace />;
  }

  // If multiple accounts and none selected, redirect to selection
  if (accounts.length > 1 && !activeAccount) {
    return <Navigate to="/select-account" replace />;
  }

  // For single account users, proceed to layout even if activeAccount is briefly null
  // The Journal page will show its own skeleton while data loads
  return <AppLayout />;
}

// Root route handler - redirect to auth for guests, journal for authenticated
function RootRoute() {
  const { user, loading } = useAuth();
  
  if (loading) return <Navigate to="/dashboard" replace />;
  if (!user) return <Navigate to="/auth" replace />;
  return <Navigate to="/dashboard" replace />;
}

const AppRoutes = ({ onDataReady }: { onDataReady?: () => void }) => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<RootRoute />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/paywall" element={<Paywall />} />
      
      <Route path="/select-account" element={
        <ProtectedRoute>
          <SelectAccount />
        </ProtectedRoute>
      } />
      {/* Protected routes */}
      <Route element={<ProtectedLayout onDataReady={onDataReady} />}>
        <Route path="/dashboard" element={<Journal />} />
        <Route path="/coach" element={<PerformanceCoach />} />
        <Route path="/backtesting" element={<Backtesting />} />
        <Route path="/playbook" element={<Playbook />} />
        <Route path="/news" element={<EconomicNews />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/history" element={<History />} />
        <Route path="/add" element={<AddTrade />} />
        <Route path="/edit/:id" element={<EditTrade />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/rules" element={<TradingRulesSettings />} />
        <Route path="/settings/timeframes" element={<TimeframesSettings />} />
        <Route path="/settings/balance" element={<BalanceSettings />} />
        <Route path="/settings/goals" element={<GoalsSettings />} />
        <Route path="/settings/currency" element={<CurrencySettings />} />
        <Route path="/settings/preferences" element={<PreferencesSettings />} />
        <Route path="/settings/profile" element={<ProfileSettings />} />
        <Route path="/settings/accounts" element={<AccountsSettings />} />
        <Route path="/settings/billing" element={<BillingSettings />} />
        <Route path="/settings/security" element={<AccountSecuritySettings />} />
        
        <Route path="/day/:date" element={<DayView />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const isAppRoute = typeof window !== "undefined" && window.location.pathname.startsWith("/app");
  const isTermsRoute = typeof window !== "undefined" && window.location.pathname === "/terms";
  const isStandalone = typeof window !== "undefined" && (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
  const shouldRedirectToApp = !isAppRoute && isStandalone;
  // Show splash only when in standalone mode (added to home screen) on mobile
  const [showSplash, setShowSplash] = useState(false);
  const [splashComplete, setSplashComplete] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    if (!isStandalone || !isMobileDevice()) {
      const root = document.getElementById('root');
      if (root) {
        root.style.display = 'block';
        root.style.visibility = 'visible';
        root.style.opacity = '1';
      }
      document.body.style.overflow = 'auto';
    }
  }, [isStandalone]);

  // Mark splash as complete when it finishes
  const handleSplashComplete = () => {
    setSplashComplete(true);
    // Make sure root is visible
    const root = document.getElementById('root');
    if (root) {
      root.style.display = 'block';
      root.style.visibility = 'visible';
      root.style.opacity = '1';
    }
  };

  // Mark data as ready when protected layout signals it
  const handleDataReady = () => {
    setIsDataReady(true);
  };

  useEffect(() => {
    if (shouldRedirectToApp) {
      window.location.replace('/app/dashboard');
    }
  }, [shouldRedirectToApp]);

  if (!isAppRoute) {
    if (shouldRedirectToApp) {
      return (
        <div className="min-h-screen w-full bg-black flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }
    return isTermsRoute ? <LandingTerms /> : <LandingHome />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* Always render the app structure so data can preload */}
        <BrowserRouter basename="/app">
          <ScrollToTop />
          <AuthProvider>
            <PreferencesProvider>
              <AccountProvider>
                <SplashScreenController 
                  showSplash={showSplash}
                  splashComplete={splashComplete}
                  isDataReady={isDataReady}
                  onSplashComplete={handleSplashComplete}
                />
                {/* App routes render underneath, allowing data to load */}
                <div className={showSplash && !splashComplete ? 'invisible' : 'visible'}>
                  <AppRoutes onDataReady={handleDataReady} />
                </div>
              </AccountProvider>
            </PreferencesProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

// Separate component to access auth context for splash screen logic
function SplashScreenController({ 
  showSplash, 
  splashComplete, 
  isDataReady, 
  onSplashComplete 
}: { 
  showSplash: boolean; 
  splashComplete: boolean; 
  isDataReady: boolean;
  onSplashComplete: () => void;
}) {
  const { user, loading } = useAuth();
  
  // For unauthenticated users or public pages, mark data as ready immediately
  // This prevents splash screen from getting stuck on auth page after sign out
  const effectiveDataReady = isDataReady || (!loading && !user);
  
  // Show the app content when splash is complete
  useEffect(() => {
    if (splashComplete) {
      const root = document.getElementById('root');
      if (root) {
        root.style.display = 'block';
        root.style.visibility = 'visible';
        root.style.opacity = '1';
      }
    }
  }, [splashComplete]);
  
  // Safety fallback: if splash takes too long, force show the app after 3 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!splashComplete) {
        const root = document.getElementById('root');
        if (root) {
          root.style.display = 'block';
          root.style.visibility = 'visible';
          root.style.opacity = '1';
        }
      }
    }, 3000);
    return () => clearTimeout(timeout);
  }, [splashComplete]);
  
  if (!showSplash || splashComplete) {
    return null;
  }
  
  return (
    <SplashScreen 
      onComplete={onSplashComplete} 
      minDisplayTime={100}
      isDataReady={effectiveDataReady}
    />
  );
}

export default App;
