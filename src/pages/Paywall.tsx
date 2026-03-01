import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

type PlanType = 'annual' | 'monthly';

export default function Paywall() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);
  
  // Stripe Price IDs - replace these with your actual price IDs
  const priceIds: Record<PlanType, string> = {
    monthly: 'price_1SuHcmELJcgT10sLDsC9DpZ6', // Replace with your monthly price ID
    annual: 'price_1SuHcmELJcgT10sLOE2DoLrq',  // Replace with your annual price ID
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleSubscribe = async (plan?: PlanType) => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    const selectedPlanType = plan ?? selectedPlan;

    try {
      // Call your create-checkout-session Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: priceIds[selectedPlanType],
          userId: user.id,
          planType: selectedPlanType,
          userEmail: user.email,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Header */}
      <header className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="gap-2 -ml-2 hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.6)', backgroundColor: 'transparent' }}
        >
          <LogOut className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.6)' }}>Sign Out</span>
        </Button>
        <div className="w-10 sm:w-20" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 pb-8 pt-2 sm:px-6 sm:py-12 sm:justify-center sm:items-center overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto">
          {/* Header Text */}
          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3 text-white">
              Choose Your Plan
            </h1>
            <p className="text-base sm:text-lg max-w-xl mx-auto leading-relaxed font-bold">
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Unlock your trading potential</span>
              <span className="text-zinc-400"> with the plan that matches your </span>
              <span className="text-zinc-400">pace</span>
              <span className="text-zinc-400">.</span>
            </p>
          </div>

          {/* Mobile Layout */}
          <div className="sm:hidden flex flex-col gap-6 pt-2">
            {/* Annual Plan - Mobile */}
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                'group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm rounded-3xl p-8 text-left transition-all duration-500 border h-full',
                selectedPlan === 'annual'
                  ? 'border-indigo-500/60 shadow-2xl shadow-indigo-500/20'
                  : 'border-indigo-500/40 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/20'
              )}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                  Save 34% Recommended
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-xl font-bold text-white mb-1">Serious Trader (Annual)</h3>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$19</span>
                  <span className="text-lg text-zinc-400">/mo</span>
                </div>

                <p className="italic text-sm text-zinc-300 leading-relaxed">
                  &quot;For traders who actually plan to still be trading next year.&quot;
                </p>

                <p className="text-sm text-zinc-500 mb-8 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Billed $228 annually.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                    <span>Unlimited Trade Imports</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                    <span>Advanced Analytics</span>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('annual');
                    handleSubscribe('annual');
                  }}
                  disabled={isLoading}
                  className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-base mt-4 border-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50"
                >
                  {isLoading && selectedPlan === 'annual' ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                      />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center justify-center relative overflow-hidden h-6">
                        <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                        <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                      </span>
                      <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                    </>
                  )}
                </Button>
              </div>
            </button>

            {/* Monthly Plan - Mobile */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={cn(
                'group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm rounded-3xl p-8 text-left transition-all duration-500 border h-full',
                selectedPlan === 'monthly'
                  ? 'border-zinc-700/80 shadow-2xl shadow-zinc-500/10'
                  : 'border-zinc-800/50 hover:border-zinc-700/60 hover:shadow-2xl hover:shadow-zinc-500/10'
              )}
            >
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-white mb-1">Flexible (Monthly)</h3>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$29</span>
                  <span className="text-lg text-zinc-400">/mo</span>
                </div>

                <p className="italic text-sm text-zinc-300 leading-relaxed">
                  &quot;For people who are afraid of commitment.&quot;
                </p>

                <p className="text-sm text-zinc-500 mb-8 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                  Billed monthly. Cancel anytime.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                    <span>Unlimited Trade Imports</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                    <span>Advanced Analytics</span>
                  </div>
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('monthly');
                    handleSubscribe('monthly');
                  }}
                  disabled={isLoading}
                  variant="secondary"
                  className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-base mt-4 border-0 bg-white/15 hover:bg-white/20 text-white transition-all duration-300 hover:shadow-md hover:shadow-white/10"
                >
                  {isLoading && selectedPlan === 'monthly' ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                      />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center justify-center relative overflow-hidden h-6">
                        <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                        <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                      </span>
                      <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                    </>
                  )}
                </Button>
              </div>
            </button>
          </div>

          {/* Desktop/Tablet Layout */}
          <div className="hidden sm:grid sm:grid-cols-2 gap-6 pt-4">
            {/* Annual Plan */}
            <button
              onClick={() => setSelectedPlan('annual')}
              className={cn(
                'group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm rounded-3xl p-8 text-left transition-all duration-500 border h-full',
                selectedPlan === 'annual'
                  ? 'border-indigo-500/60 shadow-2xl shadow-indigo-500/20'
                  : 'border-indigo-500/40 hover:border-indigo-500/60 hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.02]'
              )}
            >
              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                  Save 34% Recommended
                </div>
              </div>
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-white mb-1">
                  Serious Trader (Annual)
                </h3>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$19</span>
                  <span className="text-lg text-zinc-400">/mo</span>
                </div>
                
                <p className="italic text-sm text-zinc-300 leading-relaxed">
                  "For traders who actually plan to still be trading next year."
                </p>
                
                <p className="text-sm text-zinc-500 mb-8 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Billed $228 annually.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                    <span>Unlimited Trade Imports</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                    <span>Advanced Analytics</span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('annual');
                    handleSubscribe('annual');
                  }}
                  disabled={isLoading}
                  className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-base mt-4 border-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/50"
                >
                  {isLoading && selectedPlan === 'annual' ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                      />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center justify-center relative overflow-hidden h-6">
                        <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                        <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Commit for a Year</span>
                      </span>
                      <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                    </>
                  )}
                </Button>
              </div>
            </button>

            {/* Monthly Plan */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={cn(
                'group relative bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 backdrop-blur-sm rounded-3xl p-8 text-left transition-all duration-500 border h-full',
                selectedPlan === 'monthly'
                  ? 'border-zinc-700/80 shadow-2xl shadow-zinc-500/10'
                  : 'border-zinc-800/50 hover:border-zinc-700/60 hover:shadow-2xl hover:shadow-zinc-500/10 hover:scale-[1.02]'
              )}
            >
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-white mb-1">
                  Flexible (Monthly)
                </h3>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$29</span>
                  <span className="text-lg text-zinc-400">/mo</span>
                </div>
                
                <p className="italic text-sm text-zinc-300 leading-relaxed">
                  "For people who are afraid of commitment."
                </p>
                
                <p className="text-sm text-zinc-500 mb-8 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                  Billed monthly. Cancel anytime.
                </p>
                
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                    <span>Unlimited Trade Imports</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-zinc-300">
                    <span className="text-zinc-400 font-bold mt-0.5">✓</span>
                    <span>Advanced Analytics</span>
                  </div>
                </div>
                
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('monthly');
                    handleSubscribe('monthly');
                  }}
                  disabled={isLoading}
                  variant="secondary"
                  className="group relative overflow-hidden w-full h-12 rounded-xl font-semibold text-base mt-4 border-0 bg-white/15 hover:bg-white/20 text-white transition-all duration-300 hover:shadow-md hover:shadow-white/10"
                >
                  {isLoading && selectedPlan === 'monthly' ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 border-2 rounded-full animate-spin"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }}
                      />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <span className="flex items-center justify-center relative overflow-hidden h-6">
                        <span className="transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                        <span className="absolute top-[100%] left-1/2 -translate-x-1/2 transition-all duration-500 group-hover:translate-y-[-100%]">Start Monthly</span>
                      </span>
                      <span className="absolute top-0 left-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-shimmer" />
                    </>
                  )}
                </Button>
              </div>
            </button>
          </div>

          {/* Trust Signals */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs mt-6 sm:mt-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Secure payments via Stripe
            </span>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span>Cancel anytime</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
              <span>Instant access</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
