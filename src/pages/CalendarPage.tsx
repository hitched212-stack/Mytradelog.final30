import { useState, useMemo, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrades } from '@/hooks/useTrades';
import { useSettings } from '@/hooks/useSettings';
import { useAccount } from '@/hooks/useAccount';
import { usePreferences, GoalPeriod } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeftRight, TrendingUp, TrendingDown, Target, Activity, X, Plus, Link2, Calendar, MoreVertical, Eye, Pencil, Trash2, Grid3X3, CalendarDays } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths, getDay, startOfWeek, endOfWeek, isSameMonth, eachWeekOfInterval, addYears, subYears, startOfYear, eachMonthOfInterval, endOfYear } from 'date-fns';
// Weekdays only (Mon-Fri) - excludes Saturday (6) and Sunday (0)
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SHORT_DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5]; // Monday=1 through Friday=5
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getCurrencySymbol, Trade, Currency } from '@/types/trade';
import { TradingInsights } from '@/components/trade/TradingInsights';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTrades as useTradesStore } from '@/hooks/useTrades';
import { toast } from 'sonner';
import { TradeViewDialogContent } from '@/components/trade/TradeViewDialog';
import { ImageZoomDialog } from '@/components/ui/ImageZoomDialog';
import { SymbolIcon } from '@/components/ui/SymbolIcon';

export default function CalendarPage() {
  const navigate = useNavigate();
  const {
    preferences,
    setGoalPeriod
  } = usePreferences();
  
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDialogOpen, setDayDialogOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [tradeViewOpen, setTradeViewOpen] = useState(false);
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const isMobile = useIsMobile();
  const goalPeriod = preferences.goalPeriod;
  
  // No browser storage persistence for calendar filters
  const {
    trades,
    getMonthlyPnl,
    getDailyPnl,
    getWeeklyPnl,
    getYearlyPnl,
    deleteTrade
  } = useTrades();
  const {
    settings
  } = useSettings();
  const { activeAccount } = useAccount();
  // Use active account's currency, fallback to profile settings
  const currencySymbol = activeAccount?.currency 
    ? getCurrencySymbol(activeAccount.currency as Currency) 
    : getCurrencySymbol(settings.currency);

  // Format PnL with "k" suffix for 1000+ values, show 2 decimal places otherwise
  const formatPnlWithK = (value: number, includeSign = true) => {
    const absValue = Math.abs(value);
    const sign = includeSign ? (value >= 0 ? '+' : '-') : '';
    if (absValue >= 1000) {
      const kValue = absValue / 1000;
      return `${sign}${currencySymbol}${kValue.toFixed(1)}k`;
    }
    return `${sign}${currencySymbol}${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get monthly trades for stats - exclude paper trades
  const monthlyTrades = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return trades.filter(trade => {
      if (trade.isPaperTrade || trade.noTradeTaken) return false;
      const tradeDate = new Date(trade.date);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    });
  }, [trades, currentMonth]);

  // Calculate wins and losses
  const {
    wins,
    losses,
    winRate
  } = useMemo(() => {
    if (monthlyTrades.length === 0) return {
      wins: 0,
      losses: 0,
      winRate: 0
    };
    const winCount = monthlyTrades.filter(t => t.pnlAmount > 0).length;
    const lossCount = monthlyTrades.filter(t => t.pnlAmount < 0).length;
    return {
      wins: winCount,
      losses: lossCount,
      winRate: Math.round(winCount / monthlyTrades.length * 100)
    };
  }, [monthlyTrades]);

  // Calculate average R-R
  const avgRR = useMemo(() => {
    if (monthlyTrades.length === 0) return 0;
    const validRRs = monthlyTrades.map(t => parseFloat(t.riskRewardRatio) || 0).filter(rr => rr > 0);
    if (validRRs.length === 0) return 0;
    return validRRs.reduce((sum, rr) => sum + rr, 0) / validRRs.length;
  }, [monthlyTrades]);

  // Calculate best and worst trades
  const {
    bestTrade,
    worstTrade
  } = useMemo(() => {
    if (monthlyTrades.length === 0) return {
      bestTrade: null,
      worstTrade: null
    };
    const sorted = [...monthlyTrades].sort((a, b) => b.pnlAmount - a.pnlAmount);
    return {
      bestTrade: sorted[0],
      worstTrade: sorted[sorted.length - 1]
    };
  }, [monthlyTrades]);

  // Calculate PnL and goal based on selected period
  const {
    currentPnl,
    currentGoal,
    goalLabel
  } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = format(new Date(), 'yyyy-MM-dd');
    switch (goalPeriod) {
      case 'D':
        return {
          currentPnl: getDailyPnl(today),
          currentGoal: settings.goals.daily,
          goalLabel: 'Daily Goal Progress'
        };
      case 'W':
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        return {
          currentPnl: getWeeklyPnl(format(startOfWeek, 'yyyy-MM-dd')),
          currentGoal: settings.goals.weekly,
          goalLabel: 'Weekly Goal Progress'
        };
      case 'M':
        return {
          currentPnl: getMonthlyPnl(year, month),
          currentGoal: settings.goals.monthly,
          goalLabel: 'Monthly Goal Progress'
        };
      case 'Y':
        return {
          currentPnl: getYearlyPnl(year),
          currentGoal: settings.goals.yearly,
          goalLabel: 'Yearly Goal Progress'
        };
      default:
        return {
          currentPnl: getMonthlyPnl(year, month),
          currentGoal: settings.goals.monthly,
          goalLabel: 'Monthly Goal Progress'
        };
    }
  }, [goalPeriod, currentMonth, getDailyPnl, getWeeklyPnl, getMonthlyPnl, getYearlyPnl, settings.goals]);
  const goalProgress = currentGoal > 0 ? Math.min(currentPnl / currentGoal * 100, 100) : 0;
  const monthlyPnl = getMonthlyPnl(currentMonth.getFullYear(), currentMonth.getMonth());
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start,
      end
    });
  }, [currentMonth]);
  // startDayOffset no longer needed - weekday calendar handles positioning internally
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handlePrevYear = () => setCurrentMonth(subYears(currentMonth, 1));
  const handleNextYear = () => setCurrentMonth(addYears(currentMonth, 1));
  const handleMonthClick = (month: Date) => {
    setCurrentMonth(month);
    setViewMode('month');
  };
  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    setDayDialogOpen(true);
  };
  const selectedDayTrades = useMemo(() => {
    if (!selectedDate) return [];
    return trades.filter(t => t.date === selectedDate);
  }, [trades, selectedDate]);
  const getTradeCountForDay = (dateStr: string) => {
    return trades.filter(t => t.date === dateStr).length;
  };

  // Count trading days - exclude paper trades
  const tradingDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const uniqueDates = new Set(trades.filter(trade => {
      if (trade.isPaperTrade || trade.noTradeTaken) return false;
      const tradeDate = new Date(trade.date);
      return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
    }).map(t => t.date));
    return uniqueDates.size;
  }, [trades, currentMonth]);

  // Year view data - monthly P&L for all 12 months - exclude paper trades
  const yearMonthsData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const yearStart = startOfYear(currentMonth);
    const yearEnd = endOfYear(currentMonth);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthTrades = trades.filter(trade => {
        if (trade.isPaperTrade || trade.noTradeTaken) return false;
        const tradeDate = new Date(trade.date);
        return tradeDate >= monthStart && tradeDate <= monthEnd;
      });
      const pnl = monthTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
      const tradingDaysCount = new Set(monthTrades.map(t => t.date)).size;
      return {
        month,
        pnl,
        tradingDays: tradingDaysCount,
        tradeCount: monthTrades.length
      };
    });
  }, [trades, currentMonth]);

  // Calculate weekly P&L for the current month - exclude paper trades
  const weeklyPnlData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeks = eachWeekOfInterval({
      start: monthStart,
      end: monthEnd
    }, {
      weekStartsOn: 0
    });
    return weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, {
        weekStartsOn: 0
      });

      // Filter trades within this week that are also in the current month - exclude paper trades
      const weekTrades = trades.filter(trade => {
        if (trade.isPaperTrade || trade.noTradeTaken) return false;
        const tradeDate = new Date(trade.date);
        return tradeDate >= weekStart && tradeDate <= weekEnd && isSameMonth(tradeDate, currentMonth);
      });
      const pnl = weekTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
      const tradingDaysInWeek = new Set(weekTrades.map(t => t.date)).size;
      return {
        weekNumber: index + 1,
        pnl,
        tradingDays: tradingDaysInWeek,
        tradeCount: weekTrades.length
      };
    });
  }, [trades, currentMonth]);

  // Day of week performance for current month (weekdays only)
  const dayOfWeekStats = useMemo(() => {
    const dayStats = DAY_NAMES.map((name, index) => ({
      day: name,
      shortDay: SHORT_DAY_NAMES[index],
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    }));
    monthlyTrades.forEach(trade => {
      const dayIndex = getDay(new Date(trade.date));
      // Map Sunday=0...Saturday=6 to our weekday indices (Mon=0...Fri=4)
      if (dayIndex >= 1 && dayIndex <= 5) {
        const weekdayIndex = dayIndex - 1; // Convert to 0-4 index
        dayStats[weekdayIndex].pnl += trade.pnlAmount;
        dayStats[weekdayIndex].trades += 1;
        if (trade.pnlAmount > 0) dayStats[weekdayIndex].wins += 1;
        else if (trade.pnlAmount < 0) dayStats[weekdayIndex].losses += 1;
      }
    });
    dayStats.forEach(day => {
      day.winRate = day.trades > 0 ? day.wins / day.trades * 100 : 0;
    });
    return dayStats;
  }, [monthlyTrades]);

  // Day of week performance for entire year - exclude paper trades (weekdays only)
  const yearlyDayOfWeekStats = useMemo(() => {
    const yearStart = startOfYear(currentMonth);
    const yearEnd = endOfYear(currentMonth);
    
    const yearTrades = trades.filter(trade => {
      if (trade.isPaperTrade || trade.noTradeTaken) return false;
      const tradeDate = new Date(trade.date);
      return tradeDate >= yearStart && tradeDate <= yearEnd;
    });

    const dayStats = DAY_NAMES.map((name, index) => ({
      day: name,
      shortDay: SHORT_DAY_NAMES[index],
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      winRate: 0
    }));
    
    yearTrades.forEach(trade => {
      const dayIndex = getDay(new Date(trade.date));
      // Map Sunday=0...Saturday=6 to our weekday indices (Mon=0...Fri=4)
      if (dayIndex >= 1 && dayIndex <= 5) {
        const weekdayIndex = dayIndex - 1;
        dayStats[weekdayIndex].pnl += trade.pnlAmount;
        dayStats[weekdayIndex].trades += 1;
        if (trade.pnlAmount > 0) dayStats[weekdayIndex].wins += 1;
        else if (trade.pnlAmount < 0) dayStats[weekdayIndex].losses += 1;
      }
    });
    
    dayStats.forEach(day => {
      day.winRate = day.trades > 0 ? day.wins / day.trades * 100 : 0;
    });
    
    return dayStats;
  }, [trades, currentMonth]);

  // Find best and worst days
  const bestDay = useMemo(() => {
    return dayOfWeekStats.reduce((best, day) => day.pnl > best.pnl ? day : best, dayOfWeekStats[0]);
  }, [dayOfWeekStats]);
  const worstDay = useMemo(() => {
    return dayOfWeekStats.reduce((worst, day) => day.pnl < worst.pnl ? day : worst, dayOfWeekStats[0]);
  }, [dayOfWeekStats]);
    return <div className="min-h-screen pb-24">
      <div className="px-4 pt-2 md:px-6 md:pt-6 lg:px-8">
        <div className="flex flex-col gap-4">
          {/* Main Calendar Section - Full width on desktop */}
          <div className="w-full space-y-3">
            {/* Goal Progress Card - Professional Design */}
            <div className={cn(
              "rounded-2xl border relative overflow-hidden transition-all duration-300",
              preferences.liquidGlassEnabled
                ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                : "border-border/50 bg-card"
            )}>
              {/* Dot pattern - only show when glass is enabled */}
              {preferences.liquidGlassEnabled && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="calendar-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#calendar-dots)" />
                </svg>
              )}
              <div className="relative p-5">
                {/* Header with Month and Period Filters */}
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                    <p className="text-xs text-muted-foreground">{goalLabel}</p>
                  </div>
                  <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border/30">
                    {(['D', 'W', 'M', 'Y'] as GoalPeriod[]).map(period => <button key={period} onClick={() => setGoalPeriod(period)} className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200', goalPeriod === period ? 'bg-foreground text-background shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                        {period}
                      </button>)}
                  </div>
                </div>
                
                {/* P&L Display */}
                <div className="mb-4">
                  <span className={cn('text-4xl font-bold font-display tabular-nums', currentPnl >= 0 ? 'text-pnl-positive' : 'text-pnl-negative')}>
                    {formatPnlWithK(currentPnl)}
                  </span>
                </div>
                
                {/* Progress Bar - Enhanced */}
                <div className="space-y-2">
                  <div className="h-3 rounded-full bg-muted/40 overflow-hidden border border-border/30">
                    <div className={cn('h-full rounded-full transition-all duration-500 relative overflow-hidden', currentPnl >= 0 ? 'bg-pnl-positive' : 'bg-pnl-negative')} style={{
                    width: `${Math.max(0, Math.min(goalProgress, 100))}%`
                  }}>
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">
                      {Math.round(goalProgress)}% of Goal
                    </span>
                    <span className="font-display font-bold tabular-nums text-muted-foreground">
                      {currentPnl < 0 ? `${currencySymbol}0` : formatPnlWithK(currentPnl, false)} <span className="text-muted-foreground/60">/</span> {formatPnlWithK(currentGoal, false)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={viewMode === 'year' ? handlePrevYear : handlePrevMonth} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base font-medium text-foreground min-w-[80px] sm:min-w-[120px] text-center">
                  {viewMode === 'year' ? format(currentMonth, 'yyyy') : (
                    <>
                      <span className="sm:hidden">{format(currentMonth, 'MMM')}</span>
                      <span className="hidden sm:inline">{format(currentMonth, 'MMM yyyy')}</span>
                    </>
                  )}
                </span>
                <Button variant="outline" size="icon" onClick={viewMode === 'year' ? handleNextYear : handleNextMonth} className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === 'month' && (
                  <div className="flex items-center gap-3 text-sm mr-2">
                    <span className="text-muted-foreground">
                      PnL: <span className={cn('font-display font-bold tabular-nums', monthlyPnl >= 0 ? 'text-pnl-positive' : 'text-pnl-negative')}>{formatPnlWithK(monthlyPnl)}</span>
                    </span>
                    <span className="text-muted-foreground">Days: <span className="text-foreground font-medium">{tradingDays}</span></span>
                  </div>
                )}
                {/* Mobile View Mode Toggle - Minimal M/Y switch */}
                <div className="sm:hidden flex items-center">
                  <button
                    onClick={() => setViewMode(viewMode === 'month' ? 'year' : 'month')}
                    className="flex items-center h-7 rounded-full bg-muted/50 border border-border/50 p-0.5"
                  >
                    <span 
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                        viewMode === 'month' ? 'bg-foreground text-background' : 'text-muted-foreground'
                      )}
                    >
                      M
                    </span>
                    <span 
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium transition-all',
                        viewMode === 'year' ? 'bg-foreground text-background' : 'text-muted-foreground'
                      )}
                    >
                      Y
                    </span>
                  </button>
                </div>
                {/* Desktop View Mode Toggle */}
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('month')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      viewMode === 'month' 
                        ? 'bg-foreground text-background' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setViewMode('year')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                      viewMode === 'year' 
                        ? 'bg-foreground text-background' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    Year
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'year' ? (
              /* Year View - 12 Month Grid */
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {yearMonthsData.map((monthData, index) => {
                  const isCurrentMonth = monthData.month.getMonth() === new Date().getMonth() && 
                                         monthData.month.getFullYear() === new Date().getFullYear();
                  const hasTrades = monthData.tradeCount > 0;
                  const isWin = monthData.pnl > 0;
                  const isLoss = monthData.pnl < 0;
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleMonthClick(monthData.month)}
                      className={cn(
                        'group p-3 sm:p-4 rounded-xl transition-all text-left relative overflow-hidden',
                        preferences.liquidGlassEnabled
                          ? 'border border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl hover:bg-card'
                          : 'bg-card border border-border/50 hover:border-border hover:bg-muted/30',
                        isCurrentMonth && 'border-primary/40 bg-primary/5'
                      )}
                    >
                      {/* Dot pattern - only show when glass is enabled */}
                      {preferences.liquidGlassEnabled && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id={`month-dots-${index}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                              <circle cx="1" cy="1" r="0.75" className="fill-foreground/[0.08] dark:fill-foreground/[0.05]" />
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill={`url(#month-dots-${index})`} />
                        </svg>
                      )}
                      <div className="relative flex flex-col justify-between min-h-[80px] sm:min-h-[100px]">
                        {/* Month Header - Short name on mobile */}
                        <span className={cn(
                          'text-sm font-semibold',
                          isCurrentMonth ? 'text-primary' : 'text-foreground'
                        )}>
                          <span className="sm:hidden">{format(monthData.month, 'MMM')}</span>
                          <span className="hidden sm:inline">{format(monthData.month, 'MMMM')}</span>
                        </span>
                        
                        {/* P&L Display */}
                        <div className="my-2">
                          <span className={cn(
                            'text-base sm:text-2xl font-bold font-display tracking-tight',
                            hasTrades 
                              ? isWin ? 'text-pnl-positive' : isLoss ? 'text-pnl-negative' : 'text-foreground'
                              : 'text-muted-foreground/50'
                          )}>
                            {hasTrades ? formatPnlWithK(monthData.pnl) : '—'}
                          </span>
                        </div>
                        
                        {/* Stats Row - Compact on mobile */}
                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                            <span className="sm:hidden">{monthData.tradeCount}t</span>
                            <span className="hidden sm:inline">{monthData.tradeCount} trades</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                            <span className="sm:hidden">{monthData.tradingDays}d</span>
                            <span className="hidden sm:inline">{monthData.tradingDays} days</span>
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Month View - Original Calendar */
              <>
                {/* Day Headers with Weekly P&L column - Mon-Fri on mobile, Full week on tablet+ */}
                <div className="hidden md:grid grid-cols-[repeat(7,1fr)_auto] gap-0.5 md:gap-1 text-center mb-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className="py-1 text-[10px] font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  <div className="w-16 md:w-20" /> {/* Spacer for weekly column */}
                </div>
                {/* Mobile headers - Mon to Fri only */}
                <div className="grid md:hidden grid-cols-[repeat(5,1fr)_auto] gap-0.5 text-center mb-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                    <div key={i} className="py-1 text-[10px] font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  <div className="w-14" /> {/* Spacer for weekly column */}
                </div>

                {/* Calendar Grid with Weekly P&L - Full week */}
                <div className="space-y-0.5 md:space-y-1">
                  {(() => {
                    const monthStart = startOfMonth(currentMonth);
                    const monthEnd = endOfMonth(currentMonth);
                    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                    
                    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
                    const weeks: Date[][] = [];
                    
                    for (let i = 0; i < allDays.length; i += 7) {
                      weeks.push(allDays.slice(i, i + 7));
                    }
                    
                    return weeks.map((week, weekIndex) => {
                      const weekData = weeklyPnlData[weekIndex];
                      const weekStartBalance = activeAccount?.starting_balance || 0;
                      const weekPnlPercent = weekStartBalance > 0 ? ((weekData?.pnl || 0) / weekStartBalance * 100).toFixed(2) : '0.00';
                      
                      // For mobile: only Mon-Fri (indices 1-5), for tablet+: full week
                      const weekdaysOnly = week.slice(1, 6); // Mon to Fri
                      
                      return (
                        <>
                        {/* Desktop/Tablet - Full week */}
                        <div key={weekIndex} className="hidden md:grid grid-cols-[repeat(7,1fr)_auto] gap-0.5 md:gap-1">
                          {week.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayPnl = getDailyPnl(dateStr);
                            const dayTrades = trades.filter(t => t.date === dateStr && !t.isPaperTrade && !t.noTradeTaken);
                            const tradeCount = dayTrades.length;
                            const wins = dayTrades.filter(t => t.pnlAmount > 0).length;
                            const winRate = tradeCount > 0 ? Math.round((wins / tradeCount) * 100) : 0;
                            const isTodayDate = isToday(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            
                            // Calculate percentage based on account balance
                            const accountBalance = activeAccount?.starting_balance || 0;
                            const pnlPercent = accountBalance > 0 ? (dayPnl / accountBalance * 100).toFixed(2) : '0.00';
                            
                            return (
                              <button
                                key={dateStr}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                  'h-16 md:h-20 rounded-md flex flex-col items-center justify-center p-1 transition-all relative border',
                                  isCurrentMonth ? 'opacity-100' : 'opacity-40',
                                  isTodayDate && 'ring-2 ring-primary/60',
                                  tradeCount === 0 && 'bg-muted/30 border-border/30 hover:bg-muted/40'
                                )}
                                style={tradeCount > 0 ? {
                                  backgroundColor: `hsl(var(${dayPnl > 0 ? '--pnl-positive' : '--pnl-negative'}) / 0.15)`,
                                  borderColor: `hsl(var(${dayPnl > 0 ? '--pnl-positive' : '--pnl-negative'}) / 0.3)`
                                } : undefined}
                              >
                                {/* Date number - top left */}
                                <div className={cn(
                                  'absolute top-0.5 left-0.5 text-[10px] font-medium',
                                  isTodayDate ? 'text-primary font-bold' : 'text-muted-foreground'
                                )}>
                                  {format(day, 'd')}
                                </div>

                                {/* Trade info - centered */}
                                {tradeCount > 0 && (
                                  <div className="flex flex-col items-center gap-0.5 mt-2">
                                    <div className="text-xs font-semibold w-full text-center px-0.5 truncate"
                                      style={{ color: `hsl(var(${dayPnl >= 0 ? '--pnl-positive' : '--pnl-negative'}))` }}>
                                      {formatPnlWithK(dayPnl)}
                                    </div>
                                    <div className="text-[8px] text-muted-foreground">
                                      {tradeCount} trade{tradeCount !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          
                          {/* Weekly Summary */}
                          <div className="h-16 md:h-20 w-16 md:w-20 flex flex-col items-center justify-center rounded-md p-1.5 bg-muted/30 border border-border/30">
                            <div className="text-[9px] text-muted-foreground mb-0.5 whitespace-nowrap">
                              Week {weekIndex + 1}
                            </div>
                            <div className="text-xs font-bold font-display mb-0.5 w-full text-center truncate tabular-nums"
                              style={{ color: `hsl(var(${(weekData?.pnl || 0) >= 0 ? '--pnl-positive' : '--pnl-negative'}))` }}>
                              {formatPnlWithK(weekData?.pnl || 0)}
                            </div>
                            <div className="text-[8px] text-muted-foreground/70 whitespace-nowrap">
                              {weekData?.tradeCount || 0} trades
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile - Weekdays only (Mon-Fri) */}
                        <div key={`${weekIndex}-mobile`} className="grid md:hidden grid-cols-[repeat(5,1fr)_auto] gap-0.5 auto-rows-[4rem] items-stretch">
                          {weekdaysOnly.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const dayPnl = getDailyPnl(dateStr);
                            const dayTrades = trades.filter(t => t.date === dateStr && !t.isPaperTrade && !t.noTradeTaken);
                            const tradeCount = dayTrades.length;
                            const isTodayDate = isToday(day);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const accountBalance = activeAccount?.starting_balance || 0;
                            const pnlPercent = accountBalance > 0 ? (dayPnl / accountBalance * 100).toFixed(2) : '0.00';
                            
                            return (
                              <button
                                key={dateStr}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                  'h-16 rounded-md flex flex-col items-center justify-center p-1 transition-all relative border',
                                  isCurrentMonth ? 'opacity-100' : 'opacity-40',
                                  isTodayDate && 'ring-2 ring-primary/60',
                                  tradeCount === 0 && 'bg-muted/30 border-border/30 hover:bg-muted/40'
                                )}
                                style={tradeCount > 0 ? {
                                  backgroundColor: `hsl(var(${dayPnl > 0 ? '--pnl-positive' : '--pnl-negative'}) / 0.15)`,
                                  borderColor: `hsl(var(${dayPnl > 0 ? '--pnl-positive' : '--pnl-negative'}) / 0.3)`
                                } : undefined}
                              >
                                <div className={cn(
                                  'absolute top-0.5 left-0.5 text-[10px] font-medium',
                                  isTodayDate ? 'text-primary font-bold' : 'text-muted-foreground'
                                )}>
                                  {format(day, 'd')}
                                </div>
                                {tradeCount > 0 && (
                                  <div className="flex flex-col items-center gap-0.5 mt-2">
                                    <div className="text-[10px] font-semibold w-full text-center px-0.5 truncate tracking-tight"
                                      style={{ color: `hsl(var(${dayPnl >= 0 ? '--pnl-positive' : '--pnl-negative'}))` }}>
                                      {formatPnlWithK(dayPnl)}
                                    </div>
                                    <div className="text-[8px] text-muted-foreground">
                                      {tradeCount} trade{tradeCount !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          
                          {/* Weekly Summary - Mobile */}
                          <div className="h-16 w-14 flex flex-col items-center justify-center rounded-md p-1.5 bg-muted/30 border border-border/30">
                            <div className="text-[9px] text-muted-foreground mb-0.5 whitespace-nowrap">
                              Wk {weekIndex + 1}
                            </div>
                            <div className="text-[9px] font-bold font-display mb-0.5 w-full text-center truncate tabular-nums leading-none tracking-tight"
                              style={{ color: `hsl(var(${(weekData?.pnl || 0) >= 0 ? '--pnl-positive' : '--pnl-negative'}))` }}>
                              {formatPnlWithK(weekData?.pnl || 0)}
                            </div>
                            <div className="text-[8px] text-muted-foreground/70 whitespace-nowrap">
                              {weekData?.tradeCount || 0}t
                            </div>
                          </div>
                        </div>
                        </>
                      );
                    });
                  })()}
                </div>

                {/* Calendar Legend */}
                <div className="flex items-center justify-center gap-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-pnl-positive/20 border-2 border-pnl-positive/60" />
                    <span className="text-sm text-muted-foreground">Profitable</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-pnl-negative/20 border-2 border-pnl-negative/60" />
                    <span className="text-sm text-muted-foreground">Loss</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-muted/30 ring-2 ring-foreground/40" />
                    <span className="text-sm text-muted-foreground">Today</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Stats Section - Bottom on desktop, stacked on mobile */}
          {viewMode === 'year' ? (
            /* Year View - Only Performance by Day */
            <div className="w-full">
              <div className={cn(
                "rounded-2xl border p-4 relative overflow-hidden",
                preferences.liquidGlassEnabled
                  ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                  : "border-border/50 bg-card"
              )}>
                {/* Dot pattern - only show when glass is enabled */}
                {preferences.liquidGlassEnabled && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="year-performance-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.75" className="fill-foreground/[0.08] dark:fill-foreground/[0.05]" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#year-performance-dots)" />
                  </svg>
                )}
                <div className="relative">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Performance by Day ({format(currentMonth, 'yyyy')})</h3>
                  <div className="space-y-1.5">
                  {(() => {
                    const stats = yearlyDayOfWeekStats;
                    const yearBestDay = stats.reduce((best, day) => day.pnl > best.pnl ? day : best, stats[0]);
                    const yearWorstDay = stats.reduce((worst, day) => day.pnl < worst.pnl ? day : worst, stats[0]);
                    const maxPnl = Math.max(...stats.map(d => Math.abs(d.pnl)), 1);
                    
                    return stats.map(day => {
                      const isBestDay = day.day === yearBestDay.day && yearBestDay.pnl > 0;
                      const isWorstDay = day.day === yearWorstDay.day && yearWorstDay.pnl < 0;
                      const barWidth = day.pnl !== 0 ? Math.abs(day.pnl) / maxPnl * 100 : 0;
                      
                      return (
                        <div key={day.day} className={cn('flex items-center gap-2 p-2 rounded-xl transition-colors', isBestDay && 'bg-pnl-positive/10 border border-pnl-positive/20', isWorstDay && 'bg-pnl-negative/10 border border-pnl-negative/20', !isBestDay && !isWorstDay && 'bg-muted/30 border border-transparent')}>
                          <div className="w-10 flex-shrink-0">
                            <span className={cn('text-xs font-semibold', day.pnl > 0 ? 'text-pnl-positive' : day.pnl < 0 ? 'text-pnl-negative' : 'text-muted-foreground')}>
                              {day.shortDay}
                            </span>
                          </div>
                          <div className="flex-1 h-5 bg-muted/50 dark:bg-white/5 rounded-lg overflow-hidden relative">
                            {day.pnl !== 0 && <div className={cn('h-full rounded-lg transition-all', day.pnl >= 0 ? 'bg-pnl-positive/70' : 'bg-pnl-negative/70')} style={{
                              width: `${barWidth}%`
                            }} />}
                          </div>
                          <div className="w-16 text-right flex-shrink-0">
                            <span className={cn('text-xs font-semibold font-display', day.pnl > 0 ? 'text-pnl-positive' : day.pnl < 0 ? 'text-pnl-negative' : 'text-muted-foreground')}>
                              {formatPnlWithK(day.pnl)}
                            </span>
                          </div>
                          {isBestDay && <span className="text-[8px] text-pnl-positive font-bold bg-pnl-positive/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Best</span>}
                          {isWorstDay && <span className="text-[8px] text-pnl-negative font-bold bg-pnl-negative/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Worst</span>}
                        </div>
                      );
                    });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Month View - All Stats */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Monthly Summary */}
              <div className={cn(
                "rounded-2xl border p-4 relative overflow-hidden",
                preferences.liquidGlassEnabled
                  ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                  : "border-border/50 bg-card"
              )}>
                {/* Dot pattern - only show when glass is enabled */}
                {preferences.liquidGlassEnabled && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="summary-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#summary-dots)" />
                  </svg>
                )}
                <div className="relative">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Monthly Summary</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center">
                          <ArrowLeftRight className="h-4 w-4 text-foreground/70" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Trades</span>
                      </div>
                      <span className="text-lg font-bold text-foreground font-display">{monthlyTrades.length}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center">
                          <CalendarDays className="h-4 w-4 text-foreground/70" />
                        </div>
                        <span className="text-sm text-muted-foreground">Trading Days</span>
                      </div>
                      <span className="text-lg font-bold text-foreground font-display">{tradingDays}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-foreground/70" />
                        </div>
                        <span className="text-sm text-muted-foreground">Win Rate</span>
                      </div>
                      <span className="text-lg font-bold text-foreground font-display">{winRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best & Worst Trade */}
              {bestTrade && <div className={cn(
                "rounded-2xl border p-4 relative overflow-hidden",
                preferences.liquidGlassEnabled
                  ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                  : "border-border/50 bg-card"
              )}>
                  {/* Dot pattern - only show when glass is enabled */}
                  {preferences.liquidGlassEnabled && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="bestworst-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                          <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#bestworst-dots)" />
                    </svg>
                  )}
                  <div className="relative">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Best & Worst</h3>
                    
                    <div className="space-y-3">
                      {bestTrade.pnlAmount > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-pnl-positive/10 dark:bg-pnl-positive/15">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-pnl-positive/20 flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-pnl-positive" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{bestTrade.symbol}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(bestTrade.date), 'MMM d')}</p>
                            </div>
                          </div>
                          <span className="text-base font-bold text-pnl-positive font-display">
                            +{formatPnlWithK(bestTrade.pnlAmount, false)}
                          </span>
                        </div>
                      )}

                      {worstTrade && worstTrade.pnlAmount < 0 && <div className="flex items-center justify-between p-3 rounded-xl bg-pnl-negative/10 dark:bg-pnl-negative/15">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-pnl-negative/20 flex items-center justify-center">
                              <TrendingDown className="h-4 w-4 text-pnl-negative" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{worstTrade.symbol}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(worstTrade.date), 'MMM d')}</p>
                            </div>
                          </div>
                          <span className="text-base font-bold text-pnl-negative font-display">
                            -{formatPnlWithK(worstTrade.pnlAmount, false)}
                          </span>
                        </div>}
                    </div>
                  </div>
                </div>}

              {/* Performance by Day */}
              <div className={cn(
                "rounded-2xl border p-4 relative overflow-hidden",
                preferences.liquidGlassEnabled
                  ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                  : "border-border/50 bg-card"
              )}>
                {/* Dot pattern - only show when glass is enabled */}
                {preferences.liquidGlassEnabled && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="dayperf-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                        <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dayperf-dots)" />
                  </svg>
                )}
                <div className="relative">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Performance by Day</h3>
                  <div className="space-y-1.5">
                    {dayOfWeekStats.map(day => {
                    const isBestDay = day.day === bestDay.day && bestDay.pnl > 0;
                    const isWorstDay = day.day === worstDay.day && worstDay.pnl < 0;
                    const maxPnl = Math.max(...dayOfWeekStats.map(d => Math.abs(d.pnl)), 1);
                    const barWidth = day.pnl !== 0 ? Math.abs(day.pnl) / maxPnl * 100 : 0;
                    return <div key={day.day} className={cn('flex items-center gap-2 p-2 rounded-xl transition-colors', isBestDay && 'bg-pnl-positive/10 border border-pnl-positive/20', isWorstDay && 'bg-pnl-negative/10 border border-pnl-negative/20', !isBestDay && !isWorstDay && 'bg-muted/30 border border-transparent')}>
                          <div className="w-10 flex-shrink-0">
                            <span className={cn('text-xs font-semibold', day.pnl > 0 ? 'text-pnl-positive' : day.pnl < 0 ? 'text-pnl-negative' : 'text-muted-foreground')}>
                              {day.shortDay}
                            </span>
                          </div>
                          <div className="flex-1 h-5 bg-muted/50 dark:bg-white/5 rounded-lg overflow-hidden relative">
                            {day.pnl !== 0 && <div className={cn('h-full rounded-lg transition-all', day.pnl >= 0 ? 'bg-pnl-positive/70' : 'bg-pnl-negative/70')} style={{
                          width: `${barWidth}%`
                        }} />}
                          </div>
                          <div className="w-16 text-right flex-shrink-0">
                            <span className={cn('text-xs font-semibold font-display', day.pnl > 0 ? 'text-pnl-positive' : day.pnl < 0 ? 'text-pnl-negative' : 'text-muted-foreground')}>
                              {formatPnlWithK(day.pnl)}
                            </span>
                          </div>
                          {isBestDay && <span className="text-[8px] text-pnl-positive font-bold bg-pnl-positive/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Best</span>}
                          {isWorstDay && <span className="text-[8px] text-pnl-negative font-bold bg-pnl-negative/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Worst</span>}
                        </div>;
                  })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Day View Dialog */}
      <Dialog open={dayDialogOpen} onOpenChange={setDayDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedDate && format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              {selectedDayTrades.length} {selectedDayTrades.length === 1 ? 'trade' : 'trades'} on this day
            </p>

            {selectedDayTrades.length > 0 ? <div className="space-y-3">
                {selectedDayTrades.map(trade => {
              return <div key={trade.id} className="rounded-xl border border-border bg-card p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
                setSelectedTrade(trade);
                setDayDialogOpen(false);
                setTradeViewOpen(true);
              }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <SymbolIcon symbol={trade.symbol} size="md" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg">{trade.symbol}</span>
                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border', trade.direction === 'long' ? 'bg-pnl-positive/10 text-pnl-positive border-pnl-positive/30' : 'bg-pnl-negative/10 text-pnl-negative border-pnl-negative/30')}>
                              {trade.direction === 'long' ? 'Long' : 'Short'}
                            </span>
                            {trade.forecastId && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground flex items-center gap-1">
                                <Link2 className="h-3 w-3" />
                                Linked
                              </span>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {trade.category || 'Stocks'} • {trade.lotSize} units
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {trade.isPaperTrade || trade.noTradeTaken ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
                            {trade.isPaperTrade ? 'Paper' : 'No Trade'}
                          </span>
                        ) : (
                          <div className="text-right">
                            <p className={cn('text-lg font-bold font-display', trade.pnlAmount >= 0 ? 'text-pnl-positive' : 'text-pnl-negative')}>
                              {trade.pnlAmount >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(trade.pnlAmount).toLocaleString()}
                            </p>
                            <p className={cn('text-sm font-display', trade.pnlAmount >= 0 ? 'text-pnl-positive' : 'text-pnl-negative')}>
                              {trade.pnlAmount >= 0 ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                            </p>
                          </div>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent active:bg-transparent">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={e => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setDayDialogOpen(false);
                          setTradeViewOpen(true);
                        }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={e => {
                          e.stopPropagation();
                          setDayDialogOpen(false);
                          navigate(`/edit/${trade.id}`);
                        }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={e => {
                          e.stopPropagation();
                          setDeleteConfirmId(trade.id);
                        }}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy')}</span>
                    </div>
                  </div>;
            })}
              </div> : null}

            <Button variant="outline" className="w-full" onClick={() => {
            setDayDialogOpen(false);
            navigate(`/add?date=${selectedDate}`);
          }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Trade for This Date
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trade View Dialog */}
      <Dialog open={tradeViewOpen} onOpenChange={setTradeViewOpen}>
        <DialogContent fullScreenOnMobile hideCloseButton className="max-w-4xl sm:max-h-[90vh] p-0 gap-0 sm:overflow-hidden">
          {selectedTrade && <TradeViewDialogContent trade={selectedTrade} forecasts={{}} currencySymbol={currencySymbol} formatPnl={amount => `${amount >= 0 ? '+' : ''}${currencySymbol}${Math.abs(amount).toLocaleString()}`} onClose={() => setTradeViewOpen(false)} onEdit={tab => {
          setTradeViewOpen(false);
          navigate(`/edit/${selectedTrade.id}${tab ? `?tab=${tab}` : ''}`);
        }} onViewForecast={() => {}} onImageClick={(images, index) => {
          setZoomImages(images);
          setZoomIndex(index);
          setZoomOpen(true);
        }} />}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <ImageZoomDialog images={zoomImages} initialIndex={zoomIndex} open={zoomOpen} onOpenChange={setZoomOpen} />

      {/* Delete Trade Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={async () => {
                if (deleteConfirmId) {
                  const success = await deleteTrade(deleteConfirmId);
                  if (success) {
                    toast.success('Trade deleted successfully');
                  } else {
                    toast.error('Failed to delete trade');
                  }
                  setDeleteConfirmId(null);
                }
              }} 
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}