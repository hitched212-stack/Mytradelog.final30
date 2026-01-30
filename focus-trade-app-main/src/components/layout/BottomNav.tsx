import { NavLink, useLocation } from 'react-router-dom';
import { Plus, ChartNoAxesColumn, User, Menu, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollDirection } from '@/hooks/useScrollDirection';
import { usePreferences } from '@/hooks/usePreferences';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';

// Custom 4-dot grid icon matching the reference
const GridDotsIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <circle cx="7" cy="7" r="2.5" />
    <circle cx="17" cy="7" r="2.5" />
    <circle cx="7" cy="17" r="2.5" />
    <circle cx="17" cy="17" r="2.5" />
  </svg>
);

// Custom calendar icon - thin stroke style matching main nav
const CalendarIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
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

// Custom news/globe icon - thin stroke style matching main nav
const NewsIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

// Use Lucide Bot icon for AI Coach
const AIIcon = Bot;

// Custom backtesting icon - premium layers/history style (matches sidebar)
const BacktestIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
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
const PlaybookIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" />
    <path d="M8 11h8" />
  </svg>
);

// Custom history icon - premium scroll/timeline style
const HistoryIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
  </svg>
);

// Custom trading rules icon - minimal checklist
const TradingRulesIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
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

// Custom goals icon - target
const GoalsIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// Custom timeframes icon - clock
const TimeframesIcon = ({ className, strokeWidth = 1.5 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export function BottomNav() {
  const location = useLocation();
  const scrollDirection = useScrollDirection();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const [moreOpen, setMoreOpen] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 40 });
  
  const isMoreActive = ['/settings', '/news', '/coach', '/backtesting', '/playbook', '/history', '/settings/rules', '/settings/goals', '/settings/timeframes'].includes(location.pathname) || (location.pathname.startsWith('/settings/') && !['/settings/rules', '/settings/goals', '/settings/timeframes'].includes(location.pathname));
  
  // Calculate active index for the sliding indicator
  const getActiveIndex = () => {
    if (location.pathname === '/dashboard') return 0;
    if (location.pathname === '/analytics') return 1;
    if (location.pathname === '/calendar') return 2;
    if (isMoreActive || moreOpen) return 3;
    return -1;
  };

  const activeIndex = getActiveIndex();

  // Update indicator position based on actual DOM elements
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const navItems = containerRef.current.querySelectorAll('[data-nav-item]');
    const activeItem = navItems[activeIndex] as HTMLElement;
    
    if (activeItem && activeIndex !== -1) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      setIndicatorStyle({
        left: itemRect.left - containerRect.left + (itemRect.width - 40) / 2,
        width: 40,
      });
    }
  }, [activeIndex, moreOpen]);
  
  useEffect(() => {
    const timer = setTimeout(() => setHasAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Hide navigation when on add trade or edit trade pages
  const isTradeFormPage = location.pathname === '/add' || location.pathname.startsWith('/edit');
  if (isTradeFormPage) {
    return null;
  }

  return (
    <nav 
      className={cn(
        'fixed bottom-6 left-4 right-4 z-50 md:hidden transition-all duration-500 ease-out',
        scrollDirection === 'down' ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100',
        !hasAnimated && 'translate-y-24 opacity-0'
      )}
    >
      <div className="relative mx-auto max-w-sm">
        {/* Subtle outer glow */}
        <div className="absolute -inset-[1px] rounded-[26px] bg-gradient-to-b from-foreground/[0.08] to-transparent pointer-events-none" />
        
        <div 
          ref={containerRef}
          className={cn(
            "relative flex h-14 items-center justify-between px-2 rounded-[24px] backdrop-blur-xl border border-border/50 shadow-2xl overflow-hidden",
            isGlassEnabled
              ? "bg-background/95 dark:bg-black/85"
              : "bg-background/90 dark:bg-black/80"
          )}
        >
          {/* Dot pattern - only show when glass is enabled */}
          {isGlassEnabled && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="bottomnav-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.75" className="fill-foreground/[0.08] dark:fill-foreground/[0.05]" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#bottomnav-dots)" />
            </svg>
          )}
          {/* Subtle inner highlight */}
          <div className="absolute top-[1px] left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent pointer-events-none z-10" />
          
          {/* Fluid sliding indicator - Apple-style */}
          <div 
            className={cn(
              'absolute h-10 rounded-2xl bg-foreground/[0.12] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] pointer-events-none',
              'transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
              activeIndex === -1 && 'opacity-0'
            )}
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
              top: '7px',
            }}
          />
          
          {/* Dashboard */}
          <NavLink 
            to="/dashboard" 
            data-nav-item
            className="relative flex items-center justify-center z-10"
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <GridDotsIcon 
                className={cn(
                  'transition-all duration-300 ease-out',
                  location.pathname === '/dashboard' 
                    ? 'h-[22px] w-[22px] text-foreground' 
                    : 'h-5 w-5 text-muted-foreground'
                )} 
              />
            </div>
          </NavLink>
          
          {/* Analytics */}
          <NavLink 
            to="/analytics" 
            data-nav-item
            className="relative flex items-center justify-center z-10"
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <ChartNoAxesColumn 
                className={cn(
                  'transition-all duration-300 ease-out',
                  location.pathname === '/analytics' 
                    ? 'h-[22px] w-[22px] text-foreground' 
                    : 'h-5 w-5 text-muted-foreground'
                )} 
                strokeWidth={1.5}
              />
            </div>
          </NavLink>

          {/* Center Add Button - Box design */}
          <NavLink 
            to="/add" 
            className="relative flex items-center justify-center z-10"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-foreground text-background transition-all duration-200 hover:scale-105 active:scale-95">
              <Plus className="h-5 w-5" strokeWidth={2.5} />
            </div>
          </NavLink>

          {/* Calendar */}
          <NavLink 
            to="/calendar" 
            data-nav-item
            className="relative flex items-center justify-center z-10"
          >
            <div className="relative flex items-center justify-center w-12 h-12">
              <CalendarIcon 
                className={cn(
                  'transition-all duration-300 ease-out',
                  location.pathname === '/calendar' 
                    ? 'h-[22px] w-[22px] text-foreground' 
                    : 'h-5 w-5 text-muted-foreground'
                )} 
                strokeWidth={1.5}
              />
            </div>
          </NavLink>

          {/* More Menu */}
          <Popover open={moreOpen} onOpenChange={setMoreOpen}>
            <PopoverTrigger asChild>
              <button data-nav-item className="relative flex items-center justify-center z-10">
                <div className="relative flex items-center justify-center w-12 h-12">
                  <Menu 
                    className={cn(
                      'transition-all duration-300 ease-out',
                      moreOpen || isMoreActive
                        ? 'h-[22px] w-[22px] text-foreground' 
                        : 'h-5 w-5 text-muted-foreground'
                    )} 
                    strokeWidth={1.5}
                  />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="end" 
              sideOffset={12}
              className="w-48 p-2 bg-background/95 dark:bg-black/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl"
            >
              <div className="flex flex-col gap-0.5">
                <NavLink 
                  to="/settings" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/settings' && !location.pathname.includes('/settings/') ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <User className={cn('h-5 w-5', location.pathname === '/settings' && !location.pathname.includes('/settings/') ? 'text-foreground' : 'text-muted-foreground')} strokeWidth={1.5} />
                  <span className={cn('text-sm', location.pathname === '/settings' && !location.pathname.includes('/settings/') ? 'text-foreground' : 'text-muted-foreground')}>Profile</span>
                </NavLink>
                <NavLink 
                  to="/history" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/history' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <HistoryIcon className={cn('h-5 w-5', location.pathname === '/history' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/history' ? 'text-foreground' : 'text-muted-foreground')}>History</span>
                </NavLink>
                <NavLink 
                  to="/news" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/news' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <NewsIcon className={cn('h-5 w-5', location.pathname === '/news' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/news' ? 'text-foreground' : 'text-muted-foreground')}>News</span>
                </NavLink>
                
                {/* Divider */}
                <div className="h-px bg-border/50 my-1" />
                
                <NavLink 
                  to="/coach"
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/coach' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <AIIcon className={cn('h-5 w-5', location.pathname === '/coach' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/coach' ? 'text-foreground' : 'text-muted-foreground')}>AI Coach</span>
                </NavLink>
                <NavLink 
                  to="/backtesting" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/backtesting' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <BacktestIcon className={cn('h-5 w-5', location.pathname === '/backtesting' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/backtesting' ? 'text-foreground' : 'text-muted-foreground')}>Backtesting</span>
                </NavLink>
                <NavLink 
                  to="/playbook" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/playbook' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <PlaybookIcon className={cn('h-5 w-5', location.pathname === '/playbook' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/playbook' ? 'text-foreground' : 'text-muted-foreground')}>Playbook</span>
                </NavLink>
                
                {/* Divider */}
                <div className="h-px bg-border/50 my-1" />
                
                {/* Parameters section */}
                <NavLink 
                  to="/settings/rules" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/settings/rules' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <TradingRulesIcon className={cn('h-5 w-5', location.pathname === '/settings/rules' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/settings/rules' ? 'text-foreground' : 'text-muted-foreground')}>Trading Rules</span>
                </NavLink>
                <NavLink 
                  to="/settings/goals" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/settings/goals' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <GoalsIcon className={cn('h-5 w-5', location.pathname === '/settings/goals' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/settings/goals' ? 'text-foreground' : 'text-muted-foreground')}>P&L Goals</span>
                </NavLink>
                <NavLink 
                  to="/settings/timeframes" 
                  onClick={() => setMoreOpen(false)} 
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:bg-foreground/[0.08]"
                  style={{ backgroundColor: location.pathname === '/settings/timeframes' ? 'rgba(255,255,255,0.08)' : 'transparent' }}
                >
                  <TimeframesIcon className={cn('h-5 w-5', location.pathname === '/settings/timeframes' ? 'text-foreground' : 'text-muted-foreground')} />
                  <span className={cn('text-sm', location.pathname === '/settings/timeframes' ? 'text-foreground' : 'text-muted-foreground')}>Timeframes</span>
                </NavLink>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </nav>
  );
}