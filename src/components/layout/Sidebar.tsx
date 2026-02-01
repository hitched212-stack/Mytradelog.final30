import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChartNoAxesColumn,
  ChevronRight,
  ChevronDown,
  Plus,
  Settings,
  ChevronsUpDown,
  PanelLeft,
  LogOut,
  CreditCard,
  Wallet,
  Check,
  Target,
  Clock,
  History,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAccount } from "@/hooks/useAccount";
import { useTrades } from "@/hooks/useTrades";
import { useSettings } from "@/hooks/useSettings";
import { usePreferences } from "@/hooks/usePreferences";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { getCurrencySymbol } from "@/types/trade";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// Custom 4-dot grid icon matching mobile nav
const GridDotsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="7" r="2.5" />
    <circle cx="7" cy="17" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);

// Custom calendar icon - thin stroke style
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// Custom news/globe icon - thin stroke style
const NewsIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

import * as React from "react";

// Use Lucide Bot icon for AI Coach
export const AIIcon = Bot;

// Custom backtesting icon - premium layers/history style
const BacktestIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="M2 12l8.58 3.91a2 2 0 0 0 1.66 0L21 12" />
    <path d="M2 17l8.58 3.91a2 2 0 0 0 1.66 0L21 17" />
  </svg>
);

// Custom playbook icon - premium open book style
const PlaybookIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
  </svg>
);

// Custom trading rules icon - minimal checklist
const TradingRulesIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <polyline points="3 6 4 7 6 5" />
    <polyline points="3 12 4 13 6 11" />
    <polyline points="3 18 4 19 6 17" />
  </svg>
);

// Custom slash logo icon
const SlashLogoIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="15" y1="5" x2="9" y2="19" />
  </svg>
);

// Navigation sections with their items
const navSections = [
  {
    label: "Trading",
    items: [
      { to: "/dashboard", icon: GridDotsIcon, label: "Dashboard" },
      { to: "/calendar", icon: CalendarIcon, label: "Calendar" },
      { to: "/history", icon: History, label: "History" },
      { to: "/analytics", icon: ChartNoAxesColumn, label: "Analytics" },
    ],
  },
  {
    label: "Tools",
    items: [
      { to: "/news", icon: NewsIcon, label: "News" },
      { to: "/coach", icon: AIIcon, label: "AI Coach" },
      { to: "/backtesting", icon: BacktestIcon, label: "Backtesting" },
      { to: "/playbook", icon: PlaybookIcon, label: "Playbook" },
    ],
  },
];

// Parameters section items (collapsible)
const parametersItems = [
  { to: "/settings/rules", icon: TradingRulesIcon, label: "Trading Rules" },
  { to: "/settings/goals", icon: Target, label: "P&L Goals" },
  { to: "/settings/timeframes", icon: Clock, label: "Chart Timeframes" },
];

// Flatten all nav items for indicator positioning
const allNavItems = [
  ...navSections.flatMap((section) => section.items),
  ...parametersItems,
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { accounts, activeAccount, setActiveAccount } = useAccount();
  const { trades } = useTrades();
  const { settings } = useSettings();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });
  const [isTradingOpen, setIsTradingOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-trading-open");
    return saved !== "false"; // Default to open
  });
  const [isToolsOpen, setIsToolsOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-tools-open");
    return saved !== "false"; // Default to open
  });
  const [isParametersOpen, setIsParametersOpen] = useState(() => {
    const saved = localStorage.getItem("sidebar-parameters-open");
    return saved !== "false"; // Default to open
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  // Track active path for indicator
  const [activePath, setActivePath] = useState<string | null>(null);

  // Calculate balances for each account - exclude paper trades
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach((account) => {
      const accountTrades = trades.filter((t) => t.accountId === account.id && !t.isPaperTrade && !t.noTradeTaken);
      const totalPnl = accountTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
      balances[account.id] = (account.starting_balance || 0) + totalPnl;
    });
    return balances;
  }, [accounts, trades]);

  const activeAccounts = accounts.filter((acc) => acc.status === "active");
  const otherAccounts = activeAccounts.filter((acc) => acc.id !== activeAccount?.id);

  const formatBalance = (amount: number, currency: string) => {
    if (settings.balanceHidden) {
      return "••••••";
    }
    const symbol = getCurrencySymbol(currency as any);
    return `${symbol}${Math.abs(amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Fetch user profile for avatar
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, username").eq("user_id", user.id).single();

      if (data) {
        setAvatarUrl(data.avatar_url);
        setProfileUsername(data.username);
      }
    };

    fetchProfile();
  }, [user?.id]);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    window.dispatchEvent(new Event("sidebar-toggle"));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar-trading-open", String(isTradingOpen));
  }, [isTradingOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar-tools-open", String(isToolsOpen));
  }, [isToolsOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar-parameters-open", String(isParametersOpen));
  }, [isParametersOpen]);

  // Track active path for indicator
  useEffect(() => {
    const currentPath = location.pathname;
    const matchedPath = allNavItems.find((item) => {
      if (item.to === "/settings") {
        return currentPath.startsWith("/settings");
      }
      return currentPath === item.to;
    })?.to;

    setActivePath(matchedPath || null);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === "/settings") {
      // Don't highlight settings when on tools pages
      const toolsPaths = ["/settings/rules", "/settings/goals", "/settings/timeframes"];
      if (toolsPaths.includes(location.pathname)) return false;
      return location.pathname === "/settings" || location.pathname.startsWith("/settings");
    }
    return location.pathname === path;
  };

  const userEmail = user?.email || "";
  const userName = profileUsername || userEmail.split("@")[0] || "User";
  const userInitials = userName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <motion.aside
      className={cn(
        "hidden md:flex flex-col fixed top-4 left-4 z-40 rounded-2xl shadow-2xl overflow-hidden",
        isGlassEnabled
          ? "bg-sidebar/95 dark:bg-sidebar/80 backdrop-blur-xl border border-sidebar-border/30"
          : "bg-sidebar border border-sidebar-border/30"
      )}
      style={{ height: "calc(100vh - 32px)" }}
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Dot pattern - only show when glass is enabled */}
      {isGlassEnabled && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sidebar-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sidebar-dots)" />
        </svg>
      )}
      {/* Header with Account Switcher */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer w-full",
                isCollapsed && "justify-center",
              )}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground flex-shrink-0">
                <SlashLogoIcon className="h-4 w-4 text-background" />
              </div>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 overflow-hidden transition-opacity duration-200">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {activeAccount?.name || "MyTradeLog"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activeAccount
                        ? formatBalance(accountBalances[activeAccount.id] || 0, activeAccount.currency || "USD")
                        : "Pro"}
                    </span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="bottom"
            className="w-72 p-2 bg-card border border-border/50 shadow-lg z-50"
            sideOffset={8}
          >
            {/* Trading Accounts Section */}
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Trading Accounts
            </DropdownMenuLabel>

            {/* Active Account */}
            {activeAccount && (
              <div className="px-2 py-2 rounded-md bg-muted/50 mx-1 mb-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                      <Wallet className="h-4 w-4 text-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activeAccount.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBalance(accountBalances[activeAccount.id] || 0, activeAccount.currency || "USD")}
                      </p>
                    </div>
                  </div>
                  <Check className="h-4 w-4 text-pnl-positive flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Other Accounts */}
            {otherAccounts.map((account) => (
              <DropdownMenuItem
                key={account.id}
                onClick={() => setActiveAccount(account)}
                className="py-2 px-2 cursor-pointer mx-1"
              >
                <div className="flex items-center gap-2 min-w-0 w-full">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{account.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBalance(accountBalances[account.id] || 0, account.currency || "USD")}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem onClick={() => navigate("/settings/accounts")} className="py-2 px-2 cursor-pointer">
              <Wallet className="mr-3 h-4 w-4 text-muted-foreground" />
              <span>Manage accounts</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Add Trade Button */}
      <div className="px-3 mb-4">
        <NavLink
          to="/add"
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg bg-foreground text-background py-2 transition-all duration-200 hover:opacity-90 hover:scale-[1.02] font-medium text-sm",
            isCollapsed ? "w-10 h-10 mx-auto p-0" : "w-full px-3",
          )}
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap overflow-hidden transition-opacity duration-200">Add Trade</span>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto relative">
        {/* Trading Section - Collapsible */}
        <div>
          {!isCollapsed && (
            <button
              onClick={() => setIsTradingOpen(!isTradingOpen)}
              className="flex items-center justify-between w-full px-2 mb-2 transition-opacity duration-200 hover:opacity-80"
            >
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Trading</span>
              <motion.div animate={{ rotate: isTradingOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </button>
          )}

          <AnimatePresence initial={false}>
            {(isTradingOpen || isCollapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-visible"
              >
                <div className="space-y-0.5 py-0.5">
                  {navSections[0].items.map(({ to, icon: Icon, label }) => {
                    const active = isActive(to);
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        className={cn(
                          "relative flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 ease-out",
                          "hover:scale-[1.02]",
                          active
                            ? "text-foreground bg-muted/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          isCollapsed ? "justify-center" : "",
                        )}
                      >
                        <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                          <Icon className="h-[18px] w-[18px] stroke-[1.5px]" />
                        </div>
                        {!isCollapsed && (
                          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
                            {label}
                          </span>
                        )}
                        {/* Active indicator line */}
                        {active && !isCollapsed && (
                          <motion.div 
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="ml-auto w-[2px] h-4 bg-foreground rounded-full" 
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider between Trading and Tools */}
        {!isCollapsed && <div className="my-3 mx-2 h-px bg-border/50" />}

        {/* Tools Section - Collapsible */}
        <div>
          {!isCollapsed && (
            <button
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className="flex items-center justify-between w-full px-2 mb-2 transition-opacity duration-200 hover:opacity-80"
            >
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Tools</span>
              <motion.div animate={{ rotate: isToolsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </button>
          )}

          <AnimatePresence initial={false}>
            {(isToolsOpen || isCollapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-visible"
              >
                <div className="space-y-0.5 py-0.5">
                  {navSections[1].items.map(({ to, icon: Icon, label }) => {
                    const active = isActive(to);
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        className={cn(
                          "relative flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 ease-out",
                          "hover:scale-[1.02]",
                          active
                            ? "text-foreground bg-muted/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          isCollapsed ? "justify-center" : "",
                        )}
                      >
                        <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                          <Icon className="h-[18px] w-[18px] stroke-[1.5px]" />
                        </div>
                        {!isCollapsed && (
                          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
                            {label}
                          </span>
                        )}
                        {/* Active indicator line */}
                        {active && !isCollapsed && (
                          <motion.div 
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="ml-auto w-[2px] h-4 bg-foreground rounded-full" 
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider between Tools and Parameters */}
        {!isCollapsed && <div className="my-3 mx-2 h-px bg-border/50" />}

        {/* Parameters Section - Collapsible */}
        <div>
          {!isCollapsed && (
            <button
              onClick={() => setIsParametersOpen(!isParametersOpen)}
              className="flex items-center justify-between w-full px-2 mb-2 transition-opacity duration-200 hover:opacity-80"
            >
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Parameters</span>
              <motion.div animate={{ rotate: isParametersOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </button>
          )}

          <AnimatePresence initial={false}>
            {(isParametersOpen || isCollapsed) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-visible"
              >
                <div className="space-y-0.5 py-0.5">
                  {parametersItems.map(({ to, icon: Icon, label }) => {
                    const active = isActive(to);
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        className={cn(
                          "relative flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 ease-out",
                          "hover:scale-[1.02]",
                          active
                            ? "text-foreground bg-muted/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          isCollapsed ? "justify-center" : "",
                        )}
                      >
                        <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                          <Icon className="h-[18px] w-[18px] stroke-[1.5px]" />
                        </div>
                        {!isCollapsed && (
                          <span className="text-sm font-medium whitespace-nowrap overflow-hidden transition-opacity duration-200">
                            {label}
                          </span>
                        )}
                        {/* Active indicator line */}
                        {active && !isCollapsed && (
                          <motion.div 
                            initial={{ opacity: 0, scaleY: 0 }}
                            animate={{ opacity: 1, scaleY: 1 }}
                            exit={{ opacity: 0, scaleY: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="ml-auto w-[2px] h-4 bg-foreground rounded-full" 
                          />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider between Parameters and Settings */}
        {!isCollapsed && <div className="my-3 mx-2 h-px bg-border/50" />}

        {/* Settings - Separated */}
        <div>
          {!isCollapsed && (
            <div className="px-2 mb-2 transition-opacity duration-200">
              <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">Settings</span>
            </div>
          )}
          <NavLink
            to="/settings"
            className={cn(
              "relative flex items-center gap-3 px-2 py-2 rounded-lg transition-all duration-200 ease-out",
              "hover:scale-[1.02]",
              isActive("/settings")
                ? "text-foreground bg-muted/80"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              isCollapsed ? "justify-center" : "",
            )}
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
              <Settings className="h-[18px] w-[18px] stroke-[1.5px]" />
            </div>
            {!isCollapsed && (
              <>
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1 transition-opacity duration-200">
                  Settings
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </>
            )}
            {/* Active indicator line */}
            {/* Active indicator line */}
            {isActive("/settings") && !isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="ml-auto w-[2px] h-4 bg-foreground rounded-full" 
              />
            )}
          </NavLink>
        </div>
      </nav>

      {/* User Profile & Collapse */}
      <div className="p-3 border-t border-border/20 space-y-2">
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors w-full text-left",
                isCollapsed && "justify-center p-2",
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-muted">{userInitials}</AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex items-center justify-between flex-1 overflow-hidden min-w-0 transition-opacity duration-200">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{userName}</span>
                    <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
                  </div>
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="w-64 p-2 bg-card border border-border/50 shadow-lg z-50"
            sideOffset={8}
          >
            {/* User Header */}
            <div className="flex items-center gap-3 px-2 py-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="text-sm bg-muted">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-foreground">{userName}</span>
                <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
              </div>
            </div>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={() => navigate("/settings/billing")} className="py-2.5 px-2 cursor-pointer">
              <CreditCard className="mr-3 h-4 w-4 text-muted-foreground" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")} className="py-2.5 px-2 cursor-pointer">
              <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={handleSignOut} className="py-2.5 px-2 cursor-pointer">
              <LogOut className="mr-3 h-4 w-4 text-muted-foreground" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200",
            isCollapsed && "mx-auto",
          )}
        >
          <div
            className="transition-transform duration-200"
            style={{ transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <PanelLeft className="h-[18px] w-[18px] stroke-[1.5px]" />
          </div>
        </button>
      </div>
    </motion.aside>
  );
}
