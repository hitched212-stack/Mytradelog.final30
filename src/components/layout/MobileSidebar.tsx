import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, PieChart, CalendarDays, TrendingUp, Plus, Menu, Sun, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

// Use Lucide Bot icon for AI Coach
const AIIcon = Bot;

// Custom backtesting chart icon - professional line chart with rewind
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
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l4 2" />
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

const navItems = [{
  to: '/dashboard',
  icon: LayoutGrid,
  label: 'Dashboard'
}, {
  to: '/forecasts',
  icon: Sun,
  label: 'Forecast'
}, {
  to: '/coach',
  icon: AIIcon,
  label: 'AI Coach'
}, {
  to: '/backtesting',
  icon: BacktestIcon,
  label: 'Backtesting'
}, {
  to: '/playbook',
  icon: PlaybookIcon,
  label: 'Playbook'
}, {
  to: '/analytics',
  icon: PieChart,
  label: 'Analytics'
}, {
  to: '/calendar',
  icon: CalendarDays,
  label: 'Calendar'
}, {
  to: '/settings',
  icon: User,
  label: 'Profile'
}];
export function MobileSidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  return <div className="md:hidden">
      {/* Fixed Header with Menu Button */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border h-14 flex items-center justify-between px-4">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-base font-semibold text-emerald-400">MyTradeLog</span>
        </NavLink>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0 bg-card border-l border-border">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-base font-semibold text-emerald-400">MyTradeLog</span>
                </div>
              </div>

              {/* Add Trade Button */}
              <div className="px-3 py-3">
                <NavLink to="/add" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 w-full transition-colors hover:bg-primary/90">
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Add Trade</span>
                </NavLink>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-2 space-y-1">
                {navItems.map(({
                to,
                icon: Icon,
                label
              }) => {
                const isActive = location.pathname === to;
                // Add divider after Dashboard, AI Coach, Calendar, Profile sections
                const showDivider = to === '/dashboard' || to === '/coach' || to === '/calendar';
                return (
                  <div key={to}>
                    <NavLink to={to} onClick={() => setIsOpen(false)} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all', isActive ? 'bg-emerald-500/15 text-emerald-400' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50')}>
                      <Icon className="h-5 w-5 flex-shrink-0 stroke-[1.5px]" />
                      <span className="text-sm font-medium">{label}</span>
                    </NavLink>
                    {showDivider && <div className="my-2 mx-3 border-t border-border/50" />}
                  </div>
                );
              })}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14" />
    </div>;
}