import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useAccount } from '@/hooks/useAccount';
import { useSettings } from '@/hooks/useSettings';
import { usePreferences } from '@/hooks/usePreferences';
import { ArrowLeft, TrendingUp, Target, BarChart3, AlertTriangle, Calendar, Repeat, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrencySymbol } from '@/types/trade';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, subDays } from 'date-fns';
import { Label, Pie, PieChart } from 'recharts';
import {
  type ChartConfig,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Summary() {
  const navigate = useNavigate();
  const { trades } = useTrades();
  const { activeAccount } = useAccount();
  const { settings } = useSettings();
  const { preferences } = usePreferences();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [timeFrame, setTimeFrame] = useState<'1D' | '1W' | '1M' | '1Y'>('1M');
  
  const currencySymbol = activeAccount?.currency 
    ? getCurrencySymbol(activeAccount.currency as any) 
    : getCurrencySymbol(settings.currency);

  // Get user's custom colors for charts
  const profitColor = preferences.customColors.winColor;
  const lossColor = preferences.customColors.lossColor;

  const chartId = "performance-chart";

  // Filter trades based on timeframe
  const monthTrades = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeFrame) {
      case '1D':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '1W':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Start week on Monday
        break;
      case '1Y':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '1M':
      default:
        startDate = startOfMonth(now);
        break;
    }
    
    return trades.filter(t => {
      const tradeDate = new Date(t.date);
      return tradeDate >= startDate && !t.isPaperTrade && !t.noTradeTaken;
    });
  }, [trades, timeFrame]);

  // Prepare data for circular chart
  const chartData = useMemo(() => {
    if (monthTrades.length === 0) return [];
    
    const wins = monthTrades.filter(t => t.pnlAmount > 0).length;
    const losses = monthTrades.filter(t => t.pnlAmount < 0).length;
    const breakeven = monthTrades.filter(t => t.pnlAmount === 0).length;
    
    return [
      { name: 'wins', value: wins, fill: 'var(--color-wins)' },
      { name: 'losses', value: losses, fill: 'var(--color-losses)' },
      { name: 'breakeven', value: breakeven, fill: 'var(--color-breakeven)' }
    ].filter(item => item.value > 0);
  }, [monthTrades]);

  const chartConfig = {
    value: {
      label: "Trades",
    },
    wins: {
      label: "Wins",
      color: profitColor,
    },
    losses: {
      label: "Losses", 
      color: lossColor,
    },
    breakeven: {
      label: "Breakeven",
      color: "#64748b",
    },
  } satisfies ChartConfig;

  const [activeCategory, setActiveCategory] = useState(chartData[0]?.name || 'wins');

  const activeIndex = useMemo(
    () => chartData.findIndex(item => item.name === activeCategory),
    [activeCategory, chartData]
  );

  const categories = useMemo(() => chartData.map(item => item.name), [chartData]);

  // Calculate performance score (same logic as Analytics page)
  const performanceScore = useMemo(() => {
    if (monthTrades.length === 0) return 0;

    const winningTrades = monthTrades.filter(t => t.pnlAmount > 0);
    const losingTrades = monthTrades.filter(t => t.pnlAmount < 0);
    
    const winPercent = (winningTrades.length / monthTrades.length) * 100;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlAmount, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 3 : 0;
    const profitFactorScore = Math.min((profitFactor / 3) * 100, 100);
    
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 1;
    const winLossRatio = avgWin / avgLoss;
    const winLossScore = Math.min((winLossRatio / 2) * 100, 100);
    
    const tradeDays = new Set(monthTrades.map(t => t.date));
    const profitableDays = new Set(monthTrades.filter(t => t.pnlAmount > 0).map(t => t.date));
    const consistencyScore = tradeDays.size > 0 ? (profitableDays.size / tradeDays.size) * 100 : 0;
    
    const avgGrade = monthTrades.reduce((sum, t) => sum + (t.performanceGrade || 0), 0) / monthTrades.length;
    const gradeScore = (avgGrade / 3) * 100;
    
    const tradesWithRuleData = monthTrades.filter(t => 
      (t.followedRulesList && t.followedRulesList.length > 0) || 
      (t.brokenRules && t.brokenRules.length > 0)
    );
    let ruleComplianceScore = 50;
    if (tradesWithRuleData.length > 0) {
      const totalFollowed = tradesWithRuleData.reduce((sum, t) => sum + (t.followedRulesList?.length || 0), 0);
      const totalBroken = tradesWithRuleData.reduce((sum, t) => sum + (t.brokenRules?.length || 0), 0);
      ruleComplianceScore = totalFollowed + totalBroken > 0 ? (totalFollowed / (totalFollowed + totalBroken)) * 100 : 50;
    }
    
    const ruleAdherenceScore = gradeScore * 0.6 + ruleComplianceScore * 0.4;
    
    const overallScore = winPercent * 0.25 + profitFactorScore * 0.25 + winLossScore * 0.2 + consistencyScore * 0.15 + ruleAdherenceScore * 0.15;
    
    return overallScore;
  }, [monthTrades]);

  // Calculate best and worst trading days of the week
  const bestWorstDays = useMemo(() => {
    if (monthTrades.length === 0) {
      return { bestDay: null, worstDay: null };
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayPnl: Record<number, { total: number; count: number }> = {};

    monthTrades.forEach(t => {
      const dayOfWeek = new Date(t.date).getDay();
      if (!dayPnl[dayOfWeek]) {
        dayPnl[dayOfWeek] = { total: 0, count: 0 };
      }
      dayPnl[dayOfWeek].total += t.pnlAmount;
      dayPnl[dayOfWeek].count += 1;
    });

    let bestDay = null;
    let worstDay = null;
    let bestAvg = -Infinity;
    let worstAvg = Infinity;

    Object.entries(dayPnl).forEach(([day, data]) => {
      const avg = data.total / data.count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = dayNames[parseInt(day)];
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        worstDay = dayNames[parseInt(day)];
      }
    });

    return { bestDay, worstDay };
  }, [monthTrades]);

  // Calculate monthly metrics
  const monthlyMetrics = useMemo(() => {
    if (monthTrades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        profitFactor: 0,
        consistency: 0,
        avgWin: 0,
        avgLoss: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        bestDay: 0,
        worstDay: 0,
        profitableDays: 0,
        totalDays: 0
      };
    }

    const wins = monthTrades.filter(t => t.pnlAmount > 0);
    const losses = monthTrades.filter(t => t.pnlAmount < 0);
    const totalPnl = monthTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    const grossProfit = wins.reduce((sum, t) => sum + t.pnlAmount, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnlAmount, 0));

    // Calculate daily P&L
    const dailyPnl: Record<string, number> = {};
    monthTrades.forEach(t => {
      const day = t.date;
      dailyPnl[day] = (dailyPnl[day] || 0) + t.pnlAmount;
    });

    const dailyPnlValues = Object.values(dailyPnl);
    const profitableDays = dailyPnlValues.filter(pnl => pnl > 0).length;
    const bestDay = Math.max(...dailyPnlValues, 0);
    const worstDay = Math.min(...dailyPnlValues, 0);

    // Consistency score (0-100): based on win rate and profit factor
    const winRate = (wins.length / monthTrades.length) * 100;
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 100 : 0;
    const consistency = Math.min(100, (winRate * 0.6 + Math.min(profitFactor * 20, 40)));

    return {
      totalPnl,
      winRate,
      profitFactor,
      consistency,
      avgWin: wins.length > 0 ? grossProfit / wins.length : 0,
      avgLoss: losses.length > 0 ? grossLoss / losses.length : 0,
      totalTrades: monthTrades.length,
      wins: wins.length,
      losses: losses.length,
      bestDay,
      worstDay,
      profitableDays,
      totalDays: dailyPnlValues.length
    };
  }, [monthTrades]);

  // Analyze repeated mistakes from notes and emotional summaries
  const repeatedMistakes = useMemo(() => {
    const mistakes: Record<string, number> = {};
    const keywords = [
      'revenge', 'fomo', 'overtrading', 'oversized', 'missed stop', 'emotional', 
      'chased', 'impatient', 'greedy', 'fear', 'didnt follow plan', 'broke rule',
      'too early', 'too late', 'no setup', 'forced trade'
    ];

    monthTrades.forEach(t => {
      const textToAnalyze = [
        t.notes || '',
        t.emotionalJournalBefore || '',
        t.emotionalJournalDuring || '',
        t.emotionalJournalAfter || '',
        t.postMarketReview || '',
        t.brokenRules?.join(' ') || ''
      ].join(' ').toLowerCase();

      keywords.forEach(keyword => {
        if (textToAnalyze.includes(keyword)) {
          mistakes[keyword] = (mistakes[keyword] || 0) + 1;
        }
      });
    });

    return Object.entries(mistakes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([mistake, count]) => ({ mistake, count }));
  }, [monthTrades]);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-5 md:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">Performance Summary</h1>
            </div>
            
            {/* Timeframe Selector */}
            <div className="flex items-center gap-2">
              {(['1D', '1W', '1M', '1Y'] as const).map((frame) => (
                <Button
                  key={frame}
                  variant={timeFrame === frame ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setTimeFrame(frame)}
                  className={cn(
                    "h-9 text-sm rounded-lg px-3",
                    timeFrame === frame 
                      ? "bg-indigo-600 border border-indigo-500 hover:bg-indigo-700" 
                      : "bg-muted/40 border border-border/60 dark:bg-white/5 dark:border-white/10 hover:bg-muted/60 transition-colors"
                  )}
                >
                  {frame}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 space-y-6 max-w-7xl mx-auto">

        {/* Performance Breakdown and Insights */}
        {monthTrades.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Circular Performance Chart */}
            <div className="rounded-2xl p-4 md:p-6 pb-4 relative overflow-hidden border border-border/40 bg-card/70" data-chart={chartId}>
              <ChartStyle config={chartConfig} id={chartId} />
              
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  Performance Breakdown
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex">
                        <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Visual breakdown of your wins, losses, and breakeven trades for the month</p>
                    </TooltipContent>
                  </Tooltip>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{format(selectedMonth, 'MMMM yyyy')}</p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Circular Chart */}
                <div className="flex items-center justify-center">
                  <ChartContainer
                    className="mx-auto aspect-square w-full max-w-[320px]"
                    config={chartConfig}
                    id={chartId}
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
                      <Pie
                        data={chartData}
                        dataKey="value"
                        innerRadius={80}
                        outerRadius={130}
                        nameKey="name"
                        strokeWidth={0}
                        paddingAngle={2}
                      >
                        <Label
                          content={({ viewBox }) => {
                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                              return (
                                <text
                                  dominantBaseline="middle"
                                  textAnchor="middle"
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                >
                                  <tspan
                                    className="fill-foreground text-4xl font-bold"
                                    style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                                    x={viewBox.cx}
                                    y={viewBox.cy}
                                  >
                                    {monthlyMetrics.winRate.toFixed(0)}%
                                  </tspan>
                                  <tspan
                                    className="fill-muted-foreground text-xs uppercase tracking-wider"
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 24}
                                  >
                                    WIN RATE
                                  </tspan>
                                </text>
                              );
                            }
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-col justify-center space-y-4">
                  {chartData.map((item) => {
                    const config = chartConfig[item.name as keyof typeof chartConfig];
                    return (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-sm font-medium text-foreground capitalize">{config?.label || item.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{item.value} trades</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Grade and Mistakes */}
            <div className="rounded-2xl p-4 md:p-6 pb-4 relative overflow-hidden border border-border/40 bg-card/70">
              <div className="mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  Performance Insights
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="inline-flex">
                        <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Your performance consistency score, best/worst trading days, and common mistakes</p>
                    </TooltipContent>
                  </Tooltip>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{format(selectedMonth, 'MMMM yyyy')}</p>
              </div>

              {/* Overall Grade */}
              <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Performance Consistency</span>
                  <span className="text-lg text-pnl-positive font-display font-bold tabular-nums">
                    {performanceScore.toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      Consistency Score
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Measures how regularly you achieve profitable trading days</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <span className="font-medium text-foreground">{monthlyMetrics.consistency.toFixed(0)}/100</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      Profit Factor
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Ratio of gross profit to gross loss. Above 1.0 means profitable trading</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                    <span className="font-medium text-foreground">{monthlyMetrics.profitFactor.toFixed(2)}</span>
                  </div>
                  {bestWorstDays.bestDay && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        Best Day
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The day of the week with your highest average profit</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className="font-medium text-foreground">{bestWorstDays.bestDay}</span>
                    </div>
                  )}
                  {bestWorstDays.worstDay && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        Worst Day
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">The day of the week with your lowest average profit</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span className="font-medium text-foreground">{bestWorstDays.worstDay}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Most Common Mistakes */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Most Common Mistakes</h4>
                {repeatedMistakes.length > 0 ? (
                  <div className="space-y-1.5">
                    {repeatedMistakes.slice(0, 5).map(({ mistake, count }) => (
                      <div key={mistake} className="flex items-center justify-between text-xs">
                        <span className="text-foreground capitalize truncate flex-1 mr-2">
                          {mistake.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium tabular-nums text-destructive">{count}x</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No mistakes identified</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Monthly Performance Overview */}
        <div className="rounded-2xl p-4 md:p-6 relative overflow-hidden border border-border/40 bg-card/70">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4 flex items-center gap-1.5">
            Monthly Performance
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex">
                  <Info className="h-3 w-3 text-muted-foreground cursor-pointer" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">Detailed breakdown of your key performance metrics for this month</p>
              </TooltipContent>
            </Tooltip>
          </h3>
          
          <TooltipProvider>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metric</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Value</th>
                  <th className="text-right py-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {/* Total P&L */}
                <tr className="border-b border-border/20">
                  <td className="py-3 px-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      Total P&L
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Your total profit or loss for the selected month</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className={cn(
                    "text-right py-3 px-2 text-xs font-display font-bold tabular-nums",
                    monthlyMetrics.totalPnl >= 0 ? "text-pnl-positive" : "text-pnl-negative"
                  )}>
                    {monthlyMetrics.totalPnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(monthlyMetrics.totalPnl).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </td>
                  <td className="text-right py-3 px-2 text-xs text-muted-foreground">
                    {monthlyMetrics.totalTrades} trades
                  </td>
                </tr>

                {/* Consistency */}
                <tr className="border-b border-border/20">
                  <td className="py-3 px-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      Consistency
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Measures how regularly you achieve profitable trading days</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-xs font-display font-bold tabular-nums text-foreground">
                    {monthlyMetrics.consistency.toFixed(0)}/100
                  </td>
                  <td className="text-right py-3 px-2 text-xs text-muted-foreground">
                    {monthlyMetrics.profitableDays}/{monthlyMetrics.totalDays} days
                  </td>
                </tr>

                {/* Profit Factor */}
                <tr className="border-b border-border/20">
                  <td className="py-3 px-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      Profit Factor
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Ratio of gross profit to gross loss. Above 1.0 means profitable trading</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-xs font-display font-bold tabular-nums text-foreground">
                    {monthlyMetrics.profitFactor.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-2 text-xs text-muted-foreground">
                    Avg Win: {formatCurrency(monthlyMetrics.avgWin)}
                  </td>
                </tr>

                {/* Best Day */}
                <tr className="border-b border-border/20">
                  <td className="py-3 px-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      Best Day
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Your highest single-day profit for this month</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-xs font-display font-bold tabular-nums text-pnl-positive">
                    +{formatCurrency(monthlyMetrics.bestDay)}
                  </td>
                  <td className="text-right py-3 px-2 text-xs text-muted-foreground">
                    Worst: {formatCurrency(monthlyMetrics.worstDay)}
                  </td>
                </tr>

                {/* Average Loss */}
                <tr>
                  <td className="py-3 px-2 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      Avg Loss
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="inline-flex">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">The average amount lost per losing trade</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-xs font-display font-bold tabular-nums text-pnl-negative">
                    -{formatCurrency(monthlyMetrics.avgLoss)}
                  </td>
                  <td className="text-right py-3 px-2 text-xs text-muted-foreground">
                    {monthlyMetrics.losses} losing trades
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          </TooltipProvider>
        </div>

        {/* Empty State */}
        {monthTrades.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-lg font-medium text-foreground mb-2">No trades this month</h3>
            <p className="text-sm text-muted-foreground">
              Start logging trades to see your performance summary
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
