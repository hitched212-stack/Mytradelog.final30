import { useMemo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, ResponsiveContainer, YAxis, Tooltip, XAxis, Cell, ReferenceLine } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useAccount } from '@/hooks/useAccount';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { format, startOfDay, subDays } from 'date-fns';

interface BalanceCardProps {
  currentBalance: number;
  currencySymbol: string;
  trades: Array<{
    date: string;
    pnlAmount: number;
  }>;
  initialBalance: number;
  isBalanceHidden: boolean;
  onToggleBalanceHidden: () => void;
}

interface ChartDataPoint {
  balance: number;
  label: string;
  date: Date;
}

export function BalanceCard({ 
  currentBalance, 
  currencySymbol, 
  trades, 
  initialBalance,
  isBalanceHidden,
  onToggleBalanceHidden
}: BalanceCardProps) {
  const { preferences } = usePreferences();
  const { isSwitching } = useAccount();
  const isGlassEnabled = preferences.liquidGlassEnabled;
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1M');
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>(undefined);

  type TimePeriod = '1D' | '1W' | '1M' | '1Y';

  const periods: TimePeriod[] = ['1D', '1W', '1M', '1Y'];

  // Compute chart data strictly based on selected period
  const { chartData, percentageChange, periodLabel, hasData } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let label: string;
    let dataPoints: ChartDataPoint[] = [];

    // Get today's date string for comparison
    const todayStr = format(now, 'yyyy-MM-dd');
    
    // Calculate P&L before a given date string (exclusive)
    const getPnlBeforeDateStr = (dateStr: string) => {
      return trades
        .filter(t => t.date < dateStr)
        .reduce((sum, t) => sum + t.pnlAmount, 0);
    };


    switch (selectedPeriod) {
      case '1D': {
        // Today's trades - show as single bar with today's PnL only
        startDate = startOfDay(now);
        label = 'today';
        
        const todayTrades = trades.filter(t => t.date === todayStr);
        
        // If no trades today, return empty
        if (todayTrades.length === 0) {
          break;
        }
        
        const todayPnl = todayTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
        
        // Show today as a single bar representing today's PnL
        dataPoints.push({
          balance: todayPnl,
          label: 'Today',
          date: now
        });
        break;
      }
      
      case '1W': {
        // Last 7 days - show individual day PnL only for days with trades
        startDate = subDays(now, 6);
        startDate = startOfDay(startDate);
        label = 'this week';
        
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = todayStr;
        
        const periodTrades = trades.filter(t => t.date >= startStr && t.date <= endStr);
        
        // If no trades this week, return empty
        if (periodTrades.length === 0) {
          break;
        }
        
        // Group trades by date and calculate each day's individual PnL
        const dayPnlMap = new Map<string, { pnl: number; date: Date }>();
        periodTrades.forEach(t => {
          const existing = dayPnlMap.get(t.date);
          if (existing) {
            existing.pnl += t.pnlAmount;
          } else {
            // Parse the date string correctly to avoid timezone issues
            const [year, month, day] = t.date.split('-').map(Number);
            const tradeDate = new Date(year, month - 1, day);
            dayPnlMap.set(t.date, { pnl: t.pnlAmount, date: tradeDate });
          }
        });
        
        // Sort by date and create data points only for days with trades
        Array.from(dayPnlMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([, { pnl, date }]) => {
            dataPoints.push({
              balance: pnl,
              label: format(date, 'EEE'),
              date: date
            });
          });
        break;
      }
      
      case '1M': {
        // Last 30 days - show individual day PnL only for days with trades
        startDate = subDays(now, 29);
        startDate = startOfDay(startDate);
        label = 'this month';
        
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = todayStr;
        
        const periodTrades = trades.filter(t => t.date >= startStr && t.date <= endStr);
        
        // If no trades this month, return empty
        if (periodTrades.length === 0) {
          break;
        }
        
        // Group trades by date and calculate each day's individual PnL
        const dayPnlMap = new Map<string, { pnl: number; date: Date }>();
        periodTrades.forEach(t => {
          const existing = dayPnlMap.get(t.date);
          if (existing) {
            existing.pnl += t.pnlAmount;
          } else {
            // Parse the date string correctly to avoid timezone issues
            const [year, month, day] = t.date.split('-').map(Number);
            const tradeDate = new Date(year, month - 1, day);
            dayPnlMap.set(t.date, { pnl: t.pnlAmount, date: tradeDate });
          }
        });
        
        // Sort by date and create data points only for days with trades
        Array.from(dayPnlMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .forEach(([, { pnl, date }]) => {
            dataPoints.push({
              balance: pnl,
              label: format(date, 'd'),
              date: date
            });
          });
        break;
      }
      
      case '1Y': {
        // Last 12 months - show individual month PnL only for months with trades
        label = 'this year';
        
        // Generate exactly 12 months ending with current month
        const months: Date[] = [];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(monthDate);
        }
        
        startDate = months[0];
        const startStr = format(startDate, 'yyyy-MM-dd');
        
        // Get all trades from start of first month to today
        const periodTrades = trades.filter(t => t.date >= startStr && t.date <= todayStr);
        
        // If no trades this year, return empty
        if (periodTrades.length === 0) {
          break;
        }
        
        // Track each month's individual PnL (not cumulative)
        const monthPnlMap = new Map<string, number>();
        periodTrades.forEach(t => {
          const tradeDate = new Date(t.date);
          const key = `${tradeDate.getFullYear()}-${tradeDate.getMonth()}`;
          const current = monthPnlMap.get(key) ?? 0;
          monthPnlMap.set(key, current + t.pnlAmount);
        });
        
        // Only add bars for months that have trades
        months.forEach((month) => {
          const key = `${month.getFullYear()}-${month.getMonth()}`;
          
          if (monthPnlMap.has(key)) {
            const monthPnl = monthPnlMap.get(key) ?? 0;
            dataPoints.push({
              balance: monthPnl,
              label: format(month, 'MMM'),
              date: month
            });
          }
          // No placeholder bars for empty months
        });
        break;
      }
    }

    // Check if we have any valid data points with actual balance values
    const hasValidData = dataPoints.some(d => d.balance !== null);

    // Calculate percentage change: sum of all PnL values in the period divided by starting balance
    const totalPnl = dataPoints.reduce((sum, d) => sum + (d.balance ?? 0), 0);
    const pnlBeforePeriod = trades
      .filter(t => t.date < format(startDate, 'yyyy-MM-dd'))
      .reduce((sum, t) => sum + t.pnlAmount, 0);
    const balanceAtPeriodStart = initialBalance + pnlBeforePeriod;
    const changePercent = balanceAtPeriodStart !== 0 
      ? (totalPnl / Math.abs(balanceAtPeriodStart)) * 100 
      : 0;

    return {
      chartData: dataPoints,
      percentageChange: changePercent,
      periodLabel: label,
      hasData: hasValidData
    };
  }, [selectedPeriod, trades, initialBalance, currentBalance]);

  const isPositive = percentageChange >= 0;
  const positiveColor = 'hsl(var(--pnl-positive))';
  const negativeColor = 'hsl(var(--pnl-negative))';

  // Format function for animated balance (without currency symbol)
  const formatBalance = useCallback((value: number) => {
    const absValue = Math.abs(value);
    return `${value < 0 ? '-' : ''}${absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value !== null) {
      const pnl = payload[0].value;
      
      // Display the individual day/month PnL directly
      const sign = pnl >= 0 ? '+' : '-';
      return (
        <div className="px-2.5 py-1.5 rounded-lg text-xs font-display font-bold tabular-nums bg-card border border-border shadow-xl text-card-foreground">
          {sign}{currencySymbol}{Math.abs(pnl).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn(
      "rounded-2xl border p-4 md:p-6 relative overflow-hidden",
      isGlassEnabled
        ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
        : "border-border/50 bg-card"
    )}>
      {/* Dot pattern overlay - matching nav bar style */}
      {isGlassEnabled && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="balance-card-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.75" className="fill-foreground/[0.08] dark:fill-foreground/[0.05]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#balance-card-dots)" />
        </svg>
      )}
      {/* Glass highlight effect - only show when glass is enabled */}
      {isGlassEnabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
      )}
      <div className="relative">
        {/* Header with Balance and Period Selector */}
        <div className="flex items-start justify-between mb-4">
          {/* Balance Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <button
                onClick={onToggleBalanceHidden}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label={isBalanceHidden ? 'Show balance' : 'Hide balance'}
              >
                {isBalanceHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-3xl md:text-4xl font-bold tracking-tight text-foreground font-display">
              {isBalanceHidden ? (
                <span className="tracking-[0.15em] text-muted-foreground">••••••</span>
              ) : (
                <>
                  <span className="font-display font-bold">{currencySymbol}</span>
                  <AnimatedNumber 
                    value={currentBalance} 
                    formatFn={formatBalance}
                    duration={350}
                  />
                </>
              )}
            </p>
            <p className={cn(
              'text-sm font-medium mt-1 font-display tabular-nums',
              isBalanceHidden ? 'text-muted-foreground' : isPositive ? 'text-pnl-positive' : 'text-pnl-negative'
            )}>
              {isBalanceHidden ? (
                <span className="tracking-[0.15em]">•••</span>
              ) : (
                `${isPositive ? '+' : ''}${percentageChange.toFixed(2)}%`
              )} {periodLabel}
            </p>
          </div>

          {/* Period Selector - Top Right, raised higher on mobile */}
          <div className="flex items-center gap-0.5 p-0.5 md:p-1 rounded-lg bg-muted/50 flex-shrink-0 -mt-1 md:mt-0">
            {periods.map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-2 md:px-2.5 py-1.5 md:py-1 rounded-md text-xs font-medium transition-all duration-200',
                  selectedPeriod === period
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart with X-Axis labels */}
      <div className="h-32 -mx-4 md:-mx-6 -mb-4 md:-mb-6">
        {hasData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData} 
              margin={{ top: 5, right: 16, left: 16, bottom: 24 }}
              barCategoryGap="15%"
              onMouseLeave={() => setActiveBarIndex(undefined)}
            >
              <YAxis 
                domain={[(dataMin: number) => {
                  const min = Math.min(dataMin, 0);
                  return min - Math.abs(min) * 0.1;
                }, (dataMax: number) => {
                  const max = Math.max(dataMax, 0);
                  return max + Math.abs(max) * 0.1;
                }]} 
                hide 
              />
              <XAxis 
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ 
                  fill: 'hsl(var(--muted-foreground))', 
                  fontSize: 10,
                  fontFamily: 'var(--font-display)'
                }}
                tickMargin={8}
                interval="preserveStartEnd"
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={false}
              />
              <Bar
                dataKey="balance"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!isSwitching}
                animationDuration={600}
                animationEasing="ease-out"
                minPointSize={3}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.balance >= 0 ? positiveColor : negativeColor}
                    className="transition-opacity duration-200 cursor-pointer"
                    opacity={activeBarIndex === undefined || activeBarIndex === index ? 1 : 0.3}
                    onMouseEnter={() => setActiveBarIndex(index)}
                  />
                ))}
              </Bar>
              {activeBarIndex !== undefined && chartData[activeBarIndex] && (
                <ReferenceLine 
                  y={chartData[activeBarIndex].balance} 
                  stroke={chartData[activeBarIndex].balance >= 0 ? positiveColor : negativeColor} 
                  strokeWidth={1} 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.6} 
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No trades {periodLabel}
          </div>
        )}
      </div>
    </div>
  );
}