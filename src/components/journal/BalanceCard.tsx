import { useMemo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, ResponsiveContainer, YAxis, Tooltip, XAxis, Cell, ReferenceLine, CartesianGrid, Legend } from 'recharts';
import { Eye, EyeOff } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import { useAccount } from '@/hooks/useAccount';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { format, startOfDay, subDays, eachDayOfInterval, endOfDay } from 'date-fns';

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
  previousBalance?: number;
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
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>(undefined);
  const [activeLineIndex, setActiveLineIndex] = useState<number | undefined>(undefined);

  type TimePeriod = '1D' | '1W' | '1M' | '1Y';

  const periods: TimePeriod[] = ['1D', '1W', '1M', '1Y'];

  // Compute chart data strictly based on selected period
  const { chartData, percentageChange, periodLabel, hasData, hasPreviousBalance } = useMemo(() => {
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
        // This week - show only days with trades
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
        
        // Group trades by date
        const dayPnlMap = new Map<string, { pnl: number; date: Date }>();
        periodTrades.forEach(t => {
          const existing = dayPnlMap.get(t.date);
          if (existing) {
            existing.pnl += t.pnlAmount;
          } else {
            const [year, month, day] = t.date.split('-').map(Number);
            const tradeDate = new Date(year, month - 1, day);
            dayPnlMap.set(t.date, { pnl: t.pnlAmount, date: tradeDate });
          }
        });
        
        // Only show days that have trades
        dayPnlMap.forEach((data, dateStr) => {
          dataPoints.push({
            balance: data.pnl,
            label: format(data.date, 'EEE'),
            date: data.date
          });
        });
        
        // Sort by date
        dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
        break;
      }
      
      case '1M': {
        // Current month - show only days with trades
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = startOfDay(startDate);
        label = 'this month';
        
        const startStr = format(startDate, 'yyyy-MM-dd');
        const endStr = todayStr;
        
        const periodTrades = trades.filter(t => t.date >= startStr && t.date <= endStr);
        
        // Get previous month data (30 days before current period)
        const prevMonthStartDate = subDays(startDate, 30);
        const prevMonthStartStr = format(prevMonthStartDate, 'yyyy-MM-dd');
        const prevMonthEndStr = format(subDays(startDate, 1), 'yyyy-MM-dd');
        const prevMonthTrades = trades.filter(t => t.date >= prevMonthStartStr && t.date <= prevMonthEndStr);
        
        // Create previous month map
        const prevMonthPnlMap = new Map<number, { pnl: number; date: Date }>();
        prevMonthTrades.forEach(t => {
          const [year, month, day] = t.date.split('-').map(Number);
          const tradeDate = new Date(year, month - 1, day);
          const dayOfMonth = tradeDate.getDate();
          const existing = prevMonthPnlMap.get(dayOfMonth);
          if (existing) {
            existing.pnl += t.pnlAmount;
          } else {
            prevMonthPnlMap.set(dayOfMonth, { pnl: t.pnlAmount, date: tradeDate });
          }
        });
        
        // If no trades this month, return empty
        if (periodTrades.length === 0) {
          break;
        }
        
        // Group trades by date
        const dayPnlMap = new Map<string, { pnl: number; date: Date }>();
        periodTrades.forEach(t => {
          const existing = dayPnlMap.get(t.date);
          if (existing) {
            existing.pnl += t.pnlAmount;
          } else {
            const [year, month, day] = t.date.split('-').map(Number);
            const tradeDate = new Date(year, month - 1, day);
            dayPnlMap.set(t.date, { pnl: t.pnlAmount, date: tradeDate });
          }
        });
        
        // Only show days that have trades
        dayPnlMap.forEach((data, dateStr) => {
          const dayOfMonth = data.date.getDate();
          const prevMonthData = prevMonthPnlMap.get(dayOfMonth);
          dataPoints.push({
            balance: data.pnl,
            previousBalance: prevMonthData?.pnl ?? 0,
            label: format(data.date, 'd'),
            date: data.date
          });
        });
        
        // Sort by date
        dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
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
    const hasPreviousBalance = dataPoints.some(d => d.previousBalance !== undefined && d.previousBalance !== null && d.previousBalance !== 0);

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
      hasData: hasValidData,
      hasPreviousBalance
    };
  }, [selectedPeriod, trades, initialBalance, currentBalance]);

  const isPositive = percentageChange >= 0;
  const positiveColor = 'hsl(var(--pnl-positive))';
  const negativeColor = 'hsl(var(--pnl-negative))';

  // Get current month and previous month names
  const currentMonthName = format(new Date(), 'MMM');
  const previousMonthName = format(subDays(new Date(), 30), 'MMM');

  // Format function for animated balance (without currency symbol)
  const formatBalance = useCallback((value: number) => {
    const absValue = Math.abs(value);
    return `${value < 0 ? '-' : ''}${absValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }, []);

  // Memoize the dot render function to prevent unnecessary re-renders during animation
  const renderDot = useCallback((props: any) => {
    const { cx, cy, index } = props;
    if (cx === undefined || cy === undefined) return null;
    const radius = activeLineIndex === index ? 6 : 4;
    return (
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={isPositive ? positiveColor : negativeColor}
        style={{ 
          cursor: 'pointer',
          transition: 'r 0.2s ease',
          pointerEvents: 'visible'
        }}
        onMouseEnter={() => setActiveLineIndex(index)}
        onMouseLeave={() => setActiveLineIndex(undefined)}
      />
    );
  }, [activeLineIndex, isPositive, positiveColor, negativeColor]);

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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Balance</p>
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

          {/* Period Selector and Chart Type Toggle - Top Right */}
          <div className="flex items-center gap-2 flex-shrink-0 -mt-1 md:mt-0">
            <div className="flex items-center gap-0.5 p-0.5 md:p-1 rounded-lg bg-muted/50">
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
            
            <div className="flex items-center gap-0.5 p-0.5 md:p-1 rounded-lg bg-muted/50">
              <button
                onClick={() => setChartType('bar')}
                className={cn(
                  'p-1.5 md:p-1 rounded-md transition-all duration-200 w-[28px] h-[28px] md:w-[26px] md:h-[26px] flex items-center justify-center',
                  chartType === 'bar'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Bar chart"
                title="Bar Chart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"/>
                </svg>
              </button>
              <button
                onClick={() => setChartType('line')}
                className={cn(
                  'p-1.5 md:p-1 rounded-md transition-all duration-200 w-[28px] h-[28px] md:w-[26px] md:h-[26px] flex items-center justify-center',
                  chartType === 'line'
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Line chart"
                title="Line Chart"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M2.75 17.75q-.325-.325-.325-.75t.325-.75l5.325-5.325q.575-.575 1.425-.575t1.425.575L13.5 13.5l6.4-7.225q.275-.325.713-.325t.737.3q.275.275.287.662t-.262.688L14.9 14.9q-.575.65-1.425.688T12 15l-2.5-2.5-5.25 5.25q-.325.325-.75.325t-.75-.325"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container - Bar or Line based on selection */}
      <div className="h-32 -mx-4 md:-mx-6 -mb-4 md:-mb-6">
        {hasData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart 
                data={chartData} 
                margin={{ top: 5, right: 16, left: 16, bottom: 24 }}
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
                    fill: 'hsl(var(--muted-foreground) / 0.6)', 
                    fontSize: 10,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600
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
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-in-out"
                  animationBegin={0}
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
            ) : (
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 16, left: 16, bottom: 10 }}
                onMouseLeave={() => setActiveLineIndex(undefined)}
              >
                <CartesianGrid 
                  stroke="hsl(var(--border))" 
                  opacity={1}
                  horizontal={true}
                  vertical={false}
                  strokeDasharray="3 3"
                  strokeWidth={0.5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'hsl(var(--muted-foreground) / 0.6)',
                    fontSize: 10,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600
                  }}
                  tickFormatter={(value) => {
                    const roundedValue = Math.round(value);
                    if (roundedValue >= 1000) return `${(roundedValue / 1000).toFixed(0)}k`;
                    return roundedValue.toString();
                  }}
                  width={40}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'hsl(var(--muted-foreground) / 0.6)',
                    fontSize: 10,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600
                  }}
                  tickMargin={8}
                  interval="preserveStartEnd"
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={false}
                />
                {selectedPeriod === '1M' && (
                  <></>
                )}
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke={isPositive ? positiveColor : negativeColor}
                  strokeWidth={2}
                  connectNulls={true}
                  dot={renderDot}
                  isAnimationActive={!isSwitching}
                  animationDuration={350}
                  animationEasing="ease-in-out"
                  name="balance"
                />
                {selectedPeriod === '1M' && hasPreviousBalance && (
                  <Line
                    type="monotone"
                    dataKey="previousBalance"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    connectNulls={true}
                    strokeOpacity={0.5}
                    dot={false}
                    isAnimationActive={!isSwitching}
                    animationDuration={350}
                    animationEasing="ease-in-out"
                    name="previousBalance"
                  />
                )}
                {activeLineIndex !== undefined && activeLineIndex < chartData.length && (
                  <ReferenceLine 
                    x={activeLineIndex} 
                    stroke={chartData[activeLineIndex].balance >= 0 ? positiveColor : negativeColor} 
                    strokeWidth={1.5} 
                    strokeDasharray="4 3" 
                    strokeOpacity={0.8} 
                    isFront={true}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
            No trades {periodLabel}
          </div>
        )}
      </div>
    </div>
  );
}