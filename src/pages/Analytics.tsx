import React, { useState, useMemo, useEffect } from 'react';
import { useTrades } from '@/hooks/useTrades';
import { useSettings } from '@/hooks/useSettings';
import { useAccount } from '@/hooks/useAccount';
import { usePreferences } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';
import { format, startOfWeek, subDays, getWeek } from 'date-fns';
import { getCurrencySymbol, Currency } from '@/types/trade';
import { Target, BarChart3, Scale, Crosshair, Clock, Trophy, ArrowUpRight, ArrowDownRight, XCircle, Shield, LineChart, CalendarIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { SegmentedBarChart } from '@/components/ui/SegmentedBarChart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, ReferenceLine, CartesianGrid, PieChart, Pie, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Meh, Frown, Smile } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
type ChartViewType = 'line' | 'bar';
type TimeFrame = 'Daily' | 'Week' | 'Month' | 'Year' | 'All Time';
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const formatPnl = (value: number, currencySymbol: string): string => {
  const absValue = Math.abs(value);
  if (absValue >= 1000) {
    return `${value >= 0 ? '+' : '-'}${currencySymbol}${(absValue / 1000).toFixed(1)}k`;
  }
  return `${value >= 0 ? '+' : ''}${currencySymbol}${value.toFixed(0)}`;
};

// Glass card styles - updated to match nav-style (no gradient shine)
// Session storage key for persisting filters across navigation
const ANALYTICS_SESSION_KEY = 'analytics-filters-session';

export default function Analytics() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(() => {
    try {
      const saved = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (saved) return JSON.parse(saved).timeFrame || 'Month';
    } catch {}
    return 'Month';
  });
  const [equityChartView, setEquityChartView] = useState<ChartViewType>(() => {
    try {
      const saved = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (saved) return JSON.parse(saved).equityChartView || 'line';
    } catch {}
    return 'line';
  });
  const [activeBarIndex, setActiveBarIndex] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    try {
      const saved = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (saved) {
        const dateStr = JSON.parse(saved).selectedDate;
        return dateStr ? new Date(dateStr) : undefined;
      }
    } catch {}
    return undefined;
  });
  const {
    trades
  } = useTrades();
  const {
    settings
  } = useSettings();
  const {
    activeAccount
  } = useAccount();
  const {
    preferences
  } = usePreferences();

  // Get user's custom colors for charts
  const isDefaultPreset = preferences.activePresetId === 'default';
  const profitColor = preferences.customColors.winColor;
  const lossColor = preferences.customColors.lossColor;

  // Persist filters to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify({
      timeFrame,
      equityChartView,
      selectedDate: selectedDate?.toISOString() || null
    }));
  }, [timeFrame, equityChartView, selectedDate]);

  // Use active account's currency, fallback to profile settings
  const currencySymbol = activeAccount?.currency ? getCurrencySymbol(activeAccount.currency as Currency) : getCurrencySymbol(settings.currency);

  // Filter trades based on timeframe and exact date - exclude paper trades
  // Filtering rules:
  // - Daily → today's trades only
  // - Week → current week's trades (Mon-Sun)
  // - Month → current month's trades
  // - Year → current year's trades
  // - All Time → all trades
  const filteredTrades = useMemo(() => {
    const now = new Date();
    // First filter out paper trades and no trade taken - they should never count in analytics
    let realTrades = trades.filter(trade => !trade.isPaperTrade && !trade.noTradeTaken);

    // If exact date is selected, filter by that date only
    if (selectedDate) {
      return realTrades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return format(tradeDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      });
    }

    // Apply timeframe filter
    return realTrades.filter(trade => {
      const tradeDate = new Date(trade.date);
      if (timeFrame === 'All Time') {
        return true; // No filter - show all trades
      }
      if (timeFrame === 'Daily') {
        return format(tradeDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      }
      if (timeFrame === 'Week') {
        const weekStart = startOfWeek(now, {
          weekStartsOn: 1
        }); // Start week on Monday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        return tradeDate >= weekStart && tradeDate <= weekEnd;
      }
      if (timeFrame === 'Month') {
        return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
      }
      // Year
      return tradeDate.getFullYear() === now.getFullYear();
    });
  }, [trades, timeFrame, selectedDate]);

  // Calculate stats
  const stats = useMemo(() => {
    const parseHoldingTime = (time: string): number => {
      if (!time) return 0;
      let totalMinutes = 0;
      const hourMatch = time.match(/(\d+)\s*h/i);
      const minMatch = time.match(/(\d+)\s*m/i);
      const secMatch = time.match(/(\d+)\s*s/i);
      if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
      if (minMatch) totalMinutes += parseInt(minMatch[1]);
      if (secMatch) totalMinutes += parseInt(secMatch[1]) / 60;
      return totalMinutes;
    };
    const formatHoldingTime = (minutes: number): string => {
      if (minutes === 0) return '0m';
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      if (hours === 0) return `${mins}m`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}m`;
    };
    if (filteredTrades.length === 0) {
      return {
        totalPnl: 0,
        winRate: 0,
        totalTrades: 0,
        profitFactor: 0,
        avgRR: 0,
        longTrades: {
          count: 0,
          pnl: 0,
          winRate: 0
        },
        shortTrades: {
          count: 0,
          pnl: 0,
          winRate: 0
        },
        avgWin: 0,
        avgLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgHoldingTime: '0m',
        avgHoldingTimeWins: '0m',
        avgHoldingTimeLosses: '0m',
        consecutiveWins: 0,
        consecutiveLosses: 0,
        wins: 0,
        losses: 0,
        avgStopLossPips: 0
      };
    }
    const winningTrades = filteredTrades.filter(t => t.pnlAmount > 0);
    const losingTrades = filteredTrades.filter(t => t.pnlAmount < 0);
    const longTrades = filteredTrades.filter(t => t.direction === 'long');
    const shortTrades = filteredTrades.filter(t => t.direction === 'short');
    const totalPnl = filteredTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    const winRate = winningTrades.length / filteredTrades.length * 100;
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlAmount, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    const validRRs = filteredTrades.map(t => parseFloat(t.riskRewardRatio) || 0).filter(rr => rr > 0);
    const avgRR = validRRs.length > 0 ? validRRs.reduce((sum, rr) => sum + rr, 0) / validRRs.length : 0;
    const longWins = longTrades.filter(t => t.pnlAmount > 0).length;
    const shortWins = shortTrades.filter(t => t.pnlAmount > 0).length;
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const bestTrade = filteredTrades.length > 0 ? Math.max(...filteredTrades.map(t => t.pnlAmount)) : 0;
    const worstTrade = filteredTrades.length > 0 ? Math.min(...filteredTrades.map(t => t.pnlAmount)) : 0;
    const totalMinutes = filteredTrades.reduce((sum, t) => sum + parseHoldingTime(t.holdingTime), 0);
    const avgHoldingTimeMinutes = filteredTrades.length > 0 ? totalMinutes / filteredTrades.length : 0;
    const avgHoldingTime = formatHoldingTime(avgHoldingTimeMinutes);

    // Holding time for wins
    const winMinutes = winningTrades.reduce((sum, t) => sum + parseHoldingTime(t.holdingTime), 0);
    const avgHoldingTimeWins = formatHoldingTime(winningTrades.length > 0 ? winMinutes / winningTrades.length : 0);

    // Holding time for losses
    const lossMinutes = losingTrades.reduce((sum, t) => sum + parseHoldingTime(t.holdingTime), 0);
    const avgHoldingTimeLosses = formatHoldingTime(losingTrades.length > 0 ? lossMinutes / losingTrades.length : 0);
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;
    const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedTrades.forEach(trade => {
      if (trade.pnlAmount > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else if (trade.pnlAmount < 0) {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    });

    // Calculate average stop loss pips
    const tradesWithPips = filteredTrades.filter(t => t.stopLossPips && t.stopLossPips > 0);
    const avgStopLossPips = tradesWithPips.length > 0 ? tradesWithPips.reduce((sum, t) => sum + (t.stopLossPips || 0), 0) / tradesWithPips.length : 0;
    return {
      totalPnl,
      winRate,
      totalTrades: filteredTrades.length,
      profitFactor,
      avgRR,
      longTrades: {
        count: longTrades.length,
        pnl: longTrades.reduce((sum, t) => sum + t.pnlAmount, 0),
        winRate: longTrades.length > 0 ? longWins / longTrades.length * 100 : 0
      },
      shortTrades: {
        count: shortTrades.length,
        pnl: shortTrades.reduce((sum, t) => sum + t.pnlAmount, 0),
        winRate: shortTrades.length > 0 ? shortWins / shortTrades.length * 100 : 0
      },
      avgWin,
      avgLoss,
      bestTrade,
      worstTrade,
      avgHoldingTime,
      avgHoldingTimeWins,
      avgHoldingTimeLosses,
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses,
      wins: winningTrades.length,
      losses: losingTrades.length,
      avgStopLossPips
    };
  }, [filteredTrades]);

  // Holding time by day of week - for grouped bar chart
  const holdingTimeByDay = useMemo(() => {
    const parseHoldingTime = (time: string): number => {
      if (!time || time.trim() === '') return 0;
      let totalMinutes = 0;
      const hourMatch = time.match(/(\d+)\s*h/i);
      const minMatch = time.match(/(\d+)\s*m/i);
      const secMatch = time.match(/(\d+)\s*s/i);
      if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
      if (minMatch) totalMinutes += parseInt(minMatch[1]);
      if (secMatch) totalMinutes += parseInt(secMatch[1]) / 60;
      return totalMinutes;
    };
    const dayData: {
      [key: number]: {
        winMinutes: number;
        winCount: number;
        lossMinutes: number;
        lossCount: number;
      };
    } = {};

    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayData[i] = {
        winMinutes: 0,
        winCount: 0,
        lossMinutes: 0,
        lossCount: 0
      };
    }

    // Only include trades that have actual holding time data
    filteredTrades.forEach(trade => {
      const holdingMinutes = parseHoldingTime(trade.holdingTime);
      if (holdingMinutes === 0) return; // Skip trades without holding time

      const dayOfWeek = new Date(trade.date).getDay();
      if (trade.pnlAmount > 0) {
        dayData[dayOfWeek].winMinutes += holdingMinutes;
        dayData[dayOfWeek].winCount += 1;
      } else if (trade.pnlAmount < 0) {
        dayData[dayOfWeek].lossMinutes += holdingMinutes;
        dayData[dayOfWeek].lossCount += 1;
      }
    });
    return SHORT_DAY_NAMES.map((day, index) => ({
      day,
      wins: dayData[index].winCount > 0 ? dayData[index].winMinutes / dayData[index].winCount : 0,
      losses: dayData[index].lossCount > 0 ? dayData[index].lossMinutes / dayData[index].lossCount : 0
    }));
  }, [filteredTrades]);

  // Entry time analysis - P&L by hour of day for chart
  const entryTimeChartData = useMemo(() => {
    const hourlyData = new Map<number, {
      pnl: number;
      wins: number;
      losses: number;
      total: number;
    }>();
    filteredTrades.forEach(trade => {
      if (!trade.entryTime) return;
      const [hours] = trade.entryTime.split(':').map(Number);
      if (isNaN(hours)) return;
      const existing = hourlyData.get(hours) || {
        pnl: 0,
        wins: 0,
        losses: 0,
        total: 0
      };
      existing.pnl += trade.pnlAmount;
      existing.total += 1;
      if (trade.pnlAmount > 0) existing.wins += 1;else existing.losses += 1;
      hourlyData.set(hours, existing);
    });

    // Format hour range (e.g., "9 AM - 10 AM")
    const formatHourRange = (h: number) => {
      const formatSingle = (hour: number) => {
        if (hour === 0) return '12AM';
        if (hour === 12) return '12PM';
        if (hour < 12) return `${hour}AM`;
        return `${hour - 12}PM`;
      };
      return `${formatSingle(h)}-${formatSingle((h + 1) % 24)}`;
    };

    // Convert to array and sort by hour
    const chartData = Array.from(hourlyData.entries()).sort((a, b) => a[0] - b[0]).map(([hour, data]) => ({
      timeRange: formatHourRange(hour),
      hourNum: hour,
      pnl: data.pnl,
      wins: data.wins,
      losses: data.losses,
      total: data.total,
      winRate: data.total > 0 ? data.wins / data.total * 100 : 0
    }));

    // Calculate best and worst hours
    let bestHour = chartData.length > 0 ? chartData[0] : null;
    let worstHour = chartData.length > 0 ? chartData[0] : null;
    chartData.forEach(data => {
      if (bestHour && data.pnl > bestHour.pnl) bestHour = data;
      if (worstHour && data.pnl < worstHour.pnl) worstHour = data;
    });
    return {
      chartData,
      bestHour,
      worstHour
    };
  }, [filteredTrades]);

  // Top assets by PnL - only show profitable assets
  const topAssets = useMemo(() => {
    const assetMap = new Map<string, number>();
    filteredTrades.forEach(trade => {
      assetMap.set(trade.symbol, (assetMap.get(trade.symbol) || 0) + trade.pnlAmount);
    });
    return Array.from(assetMap.entries())
      .filter(([_, pnl]) => pnl > 0) // Only include assets with positive P&L
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [filteredTrades]);

  // Strategy profitability data - horizontal stacked bar
  const strategyProfitabilityData = useMemo(() => {
    const strategyMap = new Map<string, number>();
    let totalProfit = 0;
    
    filteredTrades.forEach(trade => {
      const strategy = trade.strategy || 'No Strategy';
      const currentPnl = strategyMap.get(strategy) || 0;
      strategyMap.set(strategy, currentPnl + trade.pnlAmount);
      if (trade.pnlAmount > 0) {
        totalProfit += trade.pnlAmount;
      }
    });
    
    // Sort by PnL descending and take top 5
    const sortedStrategies = Array.from(strategyMap.entries())
      .filter(([_, pnl]) => pnl > 0) // Only profitable strategies
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    // Calculate percentages
    const totalProfitable = sortedStrategies.reduce((sum, [_, pnl]) => sum + pnl, 0);
    
    return sortedStrategies.map(([name, pnl], index) => ({
      name,
      pnl,
      percentage: totalProfitable > 0 ? (pnl / totalProfitable) * 100 : 0,
      color: [
        'hsl(var(--pnl-positive))',
        'hsl(240, 91%, 65%)', // Blue
        'hsl(280, 87%, 65%)', // Purple  
        'hsl(36, 100%, 50%)', // Orange
        'hsl(54, 100%, 50%)', // Yellow
      ][index] || 'hsl(var(--muted-foreground))'
    }));
  }, [filteredTrades]);

  // Weekly P&L data - uses filteredTrades to respect time/month filters
  const weeklyPnlData = useMemo(() => {
    // Group filteredTrades by week
    const weekMap = new Map<string, number>();
    filteredTrades.forEach(trade => {
      const tradeDate = new Date(trade.date);
      const weekNumber = getWeek(tradeDate);
      const weekLabel = `W${weekNumber}`;
      weekMap.set(weekLabel, (weekMap.get(weekLabel) || 0) + trade.pnlAmount);
    });

    // Sort by week number and take the data
    const data = Array.from(weekMap.entries()).sort((a, b) => {
      const weekA = parseInt(a[0].substring(1));
      const weekB = parseInt(b[0].substring(1));
      return weekA - weekB;
    }).slice(-5) // Show last 5 weeks with data
    .map(([label, pnl]) => ({
      label,
      pnl
    }));

    // If no data, show empty weeks
    if (data.length === 0) {
      const now = new Date();
      return Array.from({
        length: 5
      }, (_, i) => ({
        label: `W${getWeek(subDays(now, (4 - i) * 7))}`,
        pnl: 0
      }));
    }
    return data;
  }, [filteredTrades]);

  // Equity curve data - aggregated based on timeframe
  // Aggregation rules:
  // - Daily → group by hour
  // - Week → group by day (Mon-Sun)
  // - Month → group by week number within month
  // - Year → group by month
  // - All Time → group by month+year
  const equityCurveData = useMemo(() => {
    const sortedTrades = [...filteredTrades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedTrades.length === 0) {
      return [{
        date: 'Start',
        value: 0
      }];
    }

    // Group trades based on timeframe
    const groupedData = new Map<string, {
      pnl: number;
      sortKey: number;
    }>();
    sortedTrades.forEach(trade => {
      const tradeDate = new Date(trade.date);
      let key: string;
      let sortKey: number;
      if (timeFrame === 'All Time') {
        // Aggregate by month+year for all-time view
        key = format(tradeDate, 'MMM yyyy');
        sortKey = tradeDate.getFullYear() * 12 + tradeDate.getMonth();
      } else if (timeFrame === 'Year') {
        // Aggregate by month when viewing yearly data
        key = format(tradeDate, 'MMM');
        sortKey = tradeDate.getMonth();
      } else if (timeFrame === 'Month') {
        // Aggregate by week within the month - show date range
        const dayOfMonth = tradeDate.getDate();
        const weekOfMonth = Math.ceil(dayOfMonth / 7);
        const weekStart = (weekOfMonth - 1) * 7 + 1;
        const weekEnd = Math.min(weekOfMonth * 7, new Date(tradeDate.getFullYear(), tradeDate.getMonth() + 1, 0).getDate());
        const monthAbbr = format(tradeDate, 'MMM');
        key = `${monthAbbr} ${weekStart}-${weekEnd}`;
        sortKey = weekOfMonth;
      } else if (timeFrame === 'Week') {
        // Aggregate by day of week (Mon-Sun)
        const dayIndex = tradeDate.getDay();
        key = SHORT_DAY_NAMES[dayIndex];
        sortKey = dayIndex === 0 ? 7 : dayIndex; // Put Sunday at end
      } else {
        // Daily - group by hour
        const hour = tradeDate.getHours();
        // Also check entry time if available
        let displayHour = hour;
        if (trade.entryTime) {
          const [h] = trade.entryTime.split(':').map(Number);
          if (!isNaN(h)) displayHour = h;
        }
        const formatHour = (h: number) => {
          if (h === 0) return '12AM';
          if (h === 12) return '12PM';
          if (h < 12) return `${h}AM`;
          return `${h - 12}PM`;
        };
        key = formatHour(displayHour);
        sortKey = displayHour;
      }
      const existing = groupedData.get(key);
      if (existing) {
        existing.pnl += trade.pnlAmount;
      } else {
        groupedData.set(key, {
          pnl: trade.pnlAmount,
          sortKey
        });
      }
    });

    // Sort by sortKey and build cumulative data
    const sortedEntries = Array.from(groupedData.entries()).sort((a, b) => a[1].sortKey - b[1].sortKey);

    // Build cumulative data from sorted entries
    let cumulative = 0;
    const data = [{
      date: 'Start',
      value: 0
    }];
    sortedEntries.forEach(([dateKey, {
      pnl
    }]) => {
      cumulative += pnl;
      data.push({
        date: dateKey,
        value: cumulative
      });
    });
    return data;
  }, [filteredTrades, timeFrame]);

  // Tradepath Score data for radar chart
  const tradepathScoreData = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        radarData: [{
          metric: 'Win %',
          value: 0,
          fullMark: 100
        }, {
          metric: 'Profit Factor',
          value: 0,
          fullMark: 100
        }, {
          metric: 'Win/Loss Ratio',
          value: 0,
          fullMark: 100
        }, {
          metric: 'Consistency',
          value: 0,
          fullMark: 100
        }, {
          metric: 'Rule Adherence',
          value: 0,
          fullMark: 100
        }],
        overallScore: 0
      };
    }
    const winningTrades = filteredTrades.filter(t => t.pnlAmount > 0);
    const losingTrades = filteredTrades.filter(t => t.pnlAmount < 0);
    const winPercent = winningTrades.length / filteredTrades.length * 100;
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlAmount, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 3 : 0;
    const profitFactorScore = Math.min(profitFactor / 3 * 100, 100);
    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 1;
    const winLossRatio = avgWin / avgLoss;
    const winLossScore = Math.min(winLossRatio / 2 * 100, 100);
    const tradeDays = new Set(filteredTrades.map(t => t.date));
    const profitableDays = new Set(filteredTrades.filter(t => t.pnlAmount > 0).map(t => t.date));
    const consistencyScore = tradeDays.size > 0 ? profitableDays.size / tradeDays.size * 100 : 0;

    // Rule Adherence: based on performanceGrade (1-3) normalized to 0-100
    // Also factor in rule compliance from followedRulesList vs brokenRules
    const avgGrade = filteredTrades.reduce((sum, t) => sum + (t.performanceGrade || 0), 0) / filteredTrades.length;
    const gradeScore = avgGrade / 3 * 100; // Normalize 1-3 to 0-100

    // Calculate rule compliance component
    let ruleComplianceScore = 50; // Default neutral if no rules data
    const tradesWithRuleData = filteredTrades.filter(t => t.followedRulesList && t.followedRulesList.length > 0 || t.brokenRules && t.brokenRules.length > 0);
    if (tradesWithRuleData.length > 0) {
      const totalFollowed = tradesWithRuleData.reduce((sum, t) => sum + (t.followedRulesList?.length || 0), 0);
      const totalBroken = tradesWithRuleData.reduce((sum, t) => sum + (t.brokenRules?.length || 0), 0);
      ruleComplianceScore = totalFollowed + totalBroken > 0 ? totalFollowed / (totalFollowed + totalBroken) * 100 : 50;
    }

    // Combine grade and rule compliance (60% grade, 40% rule compliance)
    const ruleAdherenceScore = gradeScore * 0.6 + ruleComplianceScore * 0.4;
    const radarData = [{
      metric: 'Win %',
      value: winPercent,
      fullMark: 100
    }, {
      metric: 'Profit Factor',
      value: profitFactorScore,
      fullMark: 100
    }, {
      metric: 'Win/Loss Ratio',
      value: winLossScore,
      fullMark: 100
    }, {
      metric: 'Consistency',
      value: consistencyScore,
      fullMark: 100
    }, {
      metric: 'Rule Adherence',
      value: ruleAdherenceScore,
      fullMark: 100
    }];
    const overallScore = winPercent * 0.25 + profitFactorScore * 0.25 + winLossScore * 0.2 + consistencyScore * 0.15 + ruleAdherenceScore * 0.15;
    return {
      radarData,
      overallScore
    };
  }, [filteredTrades]);

  // Average Emotion data - matching the 5-level emotion selector
  // Now also considers emotional journal completeness
  const emotionData = useMemo(() => {
    if (filteredTrades.length === 0) {
      return {
        level: 3,
        label: 'No Data',
        avgScore: 0,
        icon: Meh,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        iconBgColor: 'bg-yellow-500/20 border-yellow-500/40'
      };
    }

    // Calculate average emotional state
    const totalEmotionalState = filteredTrades.reduce((sum, trade) => {
      // emotionalState is 1-3 (Disappointed, Indifferent, Proud)
      const emotionalState = trade.emotionalState ?? 3;
      return sum + emotionalState;
    }, 0);
    const avgScore = totalEmotionalState / filteredTrades.length;
    // Clamp to valid range 1-3 and round
    const roundedLevel = Math.max(1, Math.min(3, Math.round(avgScore)));
    const emotionMap = {
      1: {
        label: 'Disappointed',
        icon: Frown,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10 border-red-500/30',
        iconBgColor: 'bg-red-500/20 border-red-500/40'
      },
      2: {
        label: 'Indifferent',
        icon: Meh,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
        iconBgColor: 'bg-yellow-500/20 border-yellow-500/40'
      },
      3: {
        label: 'Proud',
        icon: Smile,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        iconBgColor: 'bg-emerald-500/20 border-emerald-500/40'
      }
    };
    const emotion = emotionMap[roundedLevel as keyof typeof emotionMap] || emotionMap[3];
    return {
      level: roundedLevel,
      label: emotion.label,
      avgScore,
      icon: emotion.icon,
      color: emotion.color,
      bgColor: emotion.bgColor,
      iconBgColor: emotion.iconBgColor
    };
  }, [filteredTrades]);

  // Rule compliance analysis
  const ruleComplianceData = useMemo(() => {
    const followedMap = new Map<string, number>();
    const brokenMap = new Map<string, number>();
    let tradesWithRules = 0;
    let compliantSessions = 0; // Sessions with no broken rules
    let violatedSessions = 0; // Sessions with at least one broken rule
    let totalBrokenInViolatedSessions = 0;
    
    filteredTrades.forEach(trade => {
      const hasFollowed = trade.followedRulesList && trade.followedRulesList.length > 0;
      const hasBroken = trade.brokenRules && trade.brokenRules.length > 0;
      if (hasFollowed || hasBroken) {
        tradesWithRules++;
        if (hasBroken) {
          violatedSessions++;
          totalBrokenInViolatedSessions += trade.brokenRules!.length;
        } else {
          compliantSessions++;
        }
      }
      if (trade.followedRulesList) {
        trade.followedRulesList.forEach(rule => {
          followedMap.set(rule, (followedMap.get(rule) || 0) + 1);
        });
      }
      if (trade.brokenRules) {
        trade.brokenRules.forEach(rule => {
          brokenMap.set(rule, (brokenMap.get(rule) || 0) + 1);
        });
      }
    });

    // Sort by count and take top 5 each
    const topFollowed = Array.from(followedMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topBroken = Array.from(brokenMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const totalFollowed = Array.from(followedMap.values()).reduce((a, b) => a + b, 0);
    const totalBroken = Array.from(brokenMap.values()).reduce((a, b) => a + b, 0);
    const complianceRate = tradesWithRules > 0 ? (compliantSessions / tradesWithRules) * 100 : 0;
    const avgBrokenPerViolation = violatedSessions > 0 ? totalBrokenInViolatedSessions / violatedSessions : 0;
    const mostCommonViolation = topBroken.length > 0 ? topBroken[0] : null;
    
    return {
      topFollowed,
      topBroken,
      totalFollowed,
      totalBroken,
      complianceRate,
      tradesWithRules,
      compliantSessions,
      violatedSessions,
      avgBrokenPerViolation,
      mostCommonViolation
    };
  }, [filteredTrades]);

  // Rule violations heatmap data - broken rules by day and hour
  const ruleViolationsHeatmap = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM'];

    // Create a map to store violation counts by day and hour
    const heatmapData: {
      [key: string]: {
        [hour: string]: number;
      };
    } = {};
    days.forEach(day => {
      heatmapData[day] = {};
      hours.forEach(hour => {
        heatmapData[day][hour] = 0;
      });
    });
    let maxViolations = 0;
    filteredTrades.forEach(trade => {
      if (!trade.brokenRules || trade.brokenRules.length === 0) return;
      const tradeDate = new Date(trade.date);
      const dayOfWeek = tradeDate.getDay();
      // Convert Sunday=0 to be at end (Mon=0, Sun=6)
      const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const dayName = days[adjustedDay];

      // Get hour from entry time if available
      let hour = 9; // Default to 9AM
      if (trade.entryTime) {
        const [hourStr] = trade.entryTime.split(':');
        hour = parseInt(hourStr) || 9;
      }

      // Convert to hour label
      let hourLabel: string;
      if (hour < 6) hourLabel = '6AM';else if (hour > 20) hourLabel = '8PM';else if (hour < 12) hourLabel = `${hour}AM`;else if (hour === 12) hourLabel = '12PM';else hourLabel = `${hour - 12}PM`;
      if (heatmapData[dayName] && heatmapData[dayName][hourLabel] !== undefined) {
        heatmapData[dayName][hourLabel] += trade.brokenRules.length;
        maxViolations = Math.max(maxViolations, heatmapData[dayName][hourLabel]);
      }
    });
    return {
      heatmapData,
      days,
      hours,
      maxViolations
    };
  }, [filteredTrades]);
  return <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col gap-3 px-4 py-4 md:px-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary" className={cn("h-9 text-sm border-0 gap-2", selectedDate ? "text-foreground" : "text-muted-foreground")}>
                  <CalendarIcon className="h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={selectedDate} onSelect={date => {
                setSelectedDate(date);
                if (date) {
                  setTimeFrame('Daily');
                }
              }} initialFocus className="p-3 pointer-events-auto" />
                {selectedDate && <div className="p-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setSelectedDate(undefined)}>
                      Clear date filter
                    </Button>
                  </div>}
              </PopoverContent>
            </Popover>
            
            <Select value={timeFrame} onValueChange={(v: TimeFrame) => {
            setTimeFrame(v);
            setSelectedDate(undefined);
          }}>
              <SelectTrigger className="w-[110px] h-9 text-sm bg-secondary border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Week">Week</SelectItem>
                <SelectItem value="Month">Month</SelectItem>
                <SelectItem value="Year">Year</SelectItem>
                <SelectItem value="All Time">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 md:px-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Equity Curve with Net P&L - Premium Dark Fintech Style */}
        <div className={cn(
          "rounded-2xl p-4 md:p-6 pb-4 relative overflow-hidden border transition-all duration-300",
          preferences.liquidGlassEnabled
            ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
            : "border-border/50 bg-card"
        )}>
          {/* Dot pattern - only show when glass is enabled */}
          {preferences.liquidGlassEnabled && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="analytics-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                  <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#analytics-dots)" />
            </svg>
          )}
          {/* Header with Net P&L and Chart Toggle */}
          <div className="flex items-start justify-between mb-6 md:mb-8">
            {/* Left: Income info */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-muted-foreground mb-1 md:mb-2 font-medium tracking-wide">Total Pnl</p>
                <span className={cn("text-sm font-medium font-display tabular-nums", stats.totalPnl >= 0 ? "text-pnl-positive" : "text-pnl-negative")}>
                  {stats.totalPnl >= 0 ? '+' : '-'}{Math.abs(stats.winRate).toFixed(2)}%
                </span>
              </div>
              <p className={cn("text-3xl tracking-tight md:text-3xl font-display font-bold tabular-nums", stats.totalPnl >= 0 ? "text-pnl-positive" : "text-pnl-negative")}>
                {stats.totalPnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(stats.totalPnl).toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
              </p>
            </div>
            
            {/* Right: Chart Type Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button onClick={() => setEquityChartView('line')} className={cn("p-2 rounded-md transition-all duration-200", equityChartView === 'line' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <LineChart className="h-4 w-4" />
              </button>
              <button onClick={() => setEquityChartView('bar')} className={cn("p-2 rounded-md transition-all duration-200", equityChartView === 'bar' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Chart - responsive height */}
          <div className="h-56 md:h-72 -mx-2 md:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              {equityChartView === 'line' ? <AreaChart data={equityCurveData} margin={{
              top: 10,
              right: 5,
              left: -10,
              bottom: 0
            }}>
                  <defs>
                    {/* Gradient for positive P&L */}
                    <linearGradient id="pnlGradientPositive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={profitColor} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={profitColor} stopOpacity={0} />
                    </linearGradient>
                    {/* Gradient for negative P&L */}
                    <linearGradient id="pnlGradientNegative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={lossColor} stopOpacity={0} />
                      <stop offset="100%" stopColor={lossColor} stopOpacity={0.2} />
                    </linearGradient>
                    <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="date" tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} axisLine={false} tickLine={false} dy={10} interval="preserveStartEnd" />
                  <YAxis tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontWeight: 700
              }} axisLine={false} tickLine={false} orientation="left" tickFormatter={value => {
                const absValue = Math.abs(value);
                const prefix = value < 0 ? '-' : '';
                if (absValue >= 1000000000) return `${prefix}${currencySymbol}${(absValue / 1000000000).toFixed(0)}B`;
                if (absValue >= 1000000) return `${prefix}${currencySymbol}${(absValue / 1000000).toFixed(0)}M`;
                if (absValue >= 1000) return `${prefix}${currencySymbol}${Math.round(absValue / 1000)}k`;
                return `${prefix}${currencySymbol}${absValue}`;
              }} width={55} />
                  <Tooltip content={({
                active,
                payload,
                label
              }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number;
                  const isPositive = value >= 0;
                  const absValue = Math.abs(value);
                  const formattedValue = absValue >= 1000000 ? `${currencySymbol}${(absValue / 1000000).toFixed(2)}M` : absValue >= 1000 ? `${currencySymbol}${(absValue / 1000).toFixed(2)}k` : `${currencySymbol}${absValue.toLocaleString()}`;
                  return <div className="rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm" style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                            <p className="text-sm text-muted-foreground">
                              P&L: <span className="font-medium" style={{
                        color: isPositive ? profitColor : lossColor
                      }}>
                                {isPositive ? '+' : '-'}{formattedValue}
                              </span>
                            </p>
                          </div>;
                }
                return null;
              }} cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 1,
                strokeOpacity: 0.5
              }} />
                  <Area type="monotone" dataKey="value" stroke={stats.totalPnl >= 0 ? profitColor : lossColor} strokeWidth={2.5} fill={stats.totalPnl >= 0 ? "url(#pnlGradientPositive)" : "url(#pnlGradientNegative)"} dot={false} activeDot={{
                r: 8,
                fill: stats.totalPnl >= 0 ? profitColor : lossColor,
                stroke: 'hsl(var(--background))',
                strokeWidth: 3,
                style: {
                  filter: `drop-shadow(0 0 8px ${stats.totalPnl >= 0 ? profitColor : lossColor}) drop-shadow(0 0 16px ${stats.totalPnl >= 0 ? profitColor : lossColor})`
                }
              }} animationDuration={1500} animationEasing="ease-out" />
                </AreaChart> : <BarChart data={equityCurveData} margin={{
              top: 10,
              right: 5,
              left: -10,
              bottom: 0
            }} onMouseLeave={() => setActiveBarIndex(undefined)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} vertical={false} />
                  <XAxis dataKey="date" tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))'
              }} axisLine={false} tickLine={false} dy={10} interval="preserveStartEnd" />
                  <YAxis tick={{
                fontSize: 10,
                fill: 'hsl(var(--muted-foreground))',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontWeight: 700
              }} axisLine={false} tickLine={false} orientation="left" tickFormatter={value => {
                const absValue = Math.abs(value);
                const prefix = value < 0 ? '-' : '';
                if (absValue >= 1000000000) return `${prefix}${currencySymbol}${(absValue / 1000000000).toFixed(0)}B`;
                if (absValue >= 1000000) return `${prefix}${currencySymbol}${(absValue / 1000000).toFixed(0)}M`;
                if (absValue >= 1000) return `${prefix}${currencySymbol}${Math.round(absValue / 1000)}k`;
                return `${prefix}${currencySymbol}${absValue}`;
              }} width={55} />
                  <Tooltip content={({
                active,
                payload,
                label
              }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number;
                  const isPositive = value >= 0;
                  const absValue = Math.abs(value);
                  const formattedValue = absValue >= 1000000 ? `${currencySymbol}${(absValue / 1000000).toFixed(2)}M` : absValue >= 1000 ? `${currencySymbol}${(absValue / 1000).toFixed(2)}k` : `${currencySymbol}${absValue.toLocaleString()}`;
                  return <div className="rounded-xl px-4 py-3 shadow-2xl backdrop-blur-sm" style={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                            <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
                            <p className="text-sm text-muted-foreground">
                              P&L: <span className="font-medium" style={{
                        color: isPositive ? profitColor : lossColor
                      }}>
                                {isPositive ? '+' : '-'}{formattedValue}
                              </span>
                            </p>
                          </div>;
                }
                return null;
              }} cursor={false} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800} animationEasing="ease-out">
                    {equityCurveData.map((entry, index) => <Cell key={index} fill={entry.value >= 0 ? profitColor : lossColor} className="transition-opacity duration-200" opacity={activeBarIndex === undefined || activeBarIndex === index ? 1 : 0.3} onMouseEnter={() => setActiveBarIndex(index)} />)}
                  </Bar>
                  {activeBarIndex !== undefined && <ReferenceLine y={equityCurveData[activeBarIndex]?.value} stroke={equityCurveData[activeBarIndex]?.value >= 0 ? profitColor : lossColor} strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.5} />}
                </BarChart>}
            </ResponsiveContainer>
          </div>
        </div>
        {/* Performance Score & Rule Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Performance Score Radar */}
          <GlassCardWrapper patternId="perf-score-dots" className="p-5">
            <h3 className="font-medium mb-2">Performance Score</h3>
            <div className="flex flex-col items-center">
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={tradepathScoreData.radarData} margin={{
                  top: 20,
                  right: 30,
                  bottom: 20,
                  left: 30
                }}>
                    <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <PolarAngleAxis dataKey="metric" tick={{
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }} />
                    <Radar name="Score" dataKey="value" stroke={profitColor} fill={profitColor} fillOpacity={0.3} strokeWidth={2} />
                    <Tooltip contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--card-foreground))'
                  }} labelStyle={{
                    color: 'hsl(var(--card-foreground))'
                  }} itemStyle={{
                    color: 'hsl(var(--card-foreground))'
                  }} formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-2">
                <span className="text-3xl text-pnl-positive font-display font-bold tabular-nums">
                  {tradepathScoreData.overallScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </GlassCardWrapper>

          {/* Rule Compliance - Session Based */}
          <GlassCardWrapper patternId="rule-compliance-dots" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Session Compliance
              </h3>
              <span className="text-lg font-display font-bold tabular-nums" style={{ color: profitColor }}>
                {ruleComplianceData.complianceRate.toFixed(0)}%
              </span>
            </div>
            
            {ruleComplianceData.tradesWithRules === 0 ? (
              <div className="h-32 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No rule data recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Compliant vs Violated Sessions Bar */}
                <SegmentedBarChart
                  data={[
                    { 
                      name: `Compliant (${ruleComplianceData.compliantSessions})`, 
                      value: ruleComplianceData.compliantSessions, 
                      color: profitColor,
                      percentage: ruleComplianceData.tradesWithRules > 0 ? (ruleComplianceData.compliantSessions / ruleComplianceData.tradesWithRules) * 100 : 0
                    },
                    { 
                      name: `Violated (${ruleComplianceData.violatedSessions})`, 
                      value: ruleComplianceData.violatedSessions, 
                      color: lossColor,
                      percentage: ruleComplianceData.tradesWithRules > 0 ? (ruleComplianceData.violatedSessions / ruleComplianceData.tradesWithRules) * 100 : 0
                    },
                  ]}
                  barHeight={14}
                />

                {/* Session Stats */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>{ruleComplianceData.compliantSessions} Compliant</span>
                  <span>{ruleComplianceData.violatedSessions} Violated</span>
                </div>

                {/* Why Indicator - Only show if there are violations */}
                {ruleComplianceData.violatedSessions > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insights</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-2.5">
                        <p className="text-[10px] text-muted-foreground">Avg. rules broken</p>
                        <p className="text-sm font-display font-bold tabular-nums" style={{ color: lossColor }}>
                          {ruleComplianceData.avgBrokenPerViolation.toFixed(1)}
                        </p>
                      </div>
                      {ruleComplianceData.mostCommonViolation && (
                        <div className="bg-muted/30 rounded-lg p-2.5">
                          <p className="text-[10px] text-muted-foreground">Most common</p>
                          <p className="text-xs font-medium text-foreground truncate" title={ruleComplianceData.mostCommonViolation[0]}>
                            {ruleComplianceData.mostCommonViolation[0]}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rule Violations Breakdown - Only show if there are broken rules */}
                {ruleComplianceData.topBroken.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Rule Violations</p>
                    <div className="space-y-1.5">
                      {ruleComplianceData.topBroken.slice(0, 4).map(([rule, count]) => (
                        <div key={rule} className="flex items-center justify-between">
                          <span className="text-xs text-foreground truncate flex-1 mr-2">{rule}</span>
                          <span className="text-xs font-display font-medium tabular-nums" style={{ color: lossColor }}>
                            {count}x
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCardWrapper>
        </div>

        {/* Win Rate & Direction Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Win Rate Pie Chart */}
          <GlassCardWrapper patternId="winrate-dots" className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                Win Rate
              </h3>
              <span className="text-lg font-display font-bold tabular-nums" style={{ color: profitColor }}>
                {stats.winRate.toFixed(0)}%
              </span>
            </div>
            
            {stats.totalTrades === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No trades recorded yet</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <ChartContainer 
                  config={{
                    wins: { label: "Wins", color: profitColor },
                    losses: { label: "Losses", color: lossColor }
                  } satisfies ChartConfig} 
                  className="mx-auto aspect-square h-[180px] [&_.recharts-text]:fill-background"
                >
                  <PieChart>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="rounded-lg px-3 py-2 shadow-xl bg-card border border-border">
                              <p className="text-sm font-medium text-foreground">
                                {data.name}: {data.value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }} 
                    />
                    <Pie 
                      data={[
                        { name: 'Wins', value: stats.wins, fill: profitColor },
                        { name: 'Losses', value: stats.losses, fill: lossColor }
                      ]} 
                      dataKey="value" 
                      innerRadius={25}
                      outerRadius={75}
                      cornerRadius={8}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      <LabelList 
                        dataKey="value" 
                        stroke="none" 
                        fontSize={12} 
                        fontWeight={600} 
                        fill="currentColor"
                        formatter={(value: number) => value.toString()} 
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: profitColor }} />
                    <span className="text-xs text-muted-foreground">Wins ({stats.wins})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lossColor }} />
                    <span className="text-xs text-muted-foreground">Losses ({stats.losses})</span>
                  </div>
                </div>
              </div>
            )}
          </GlassCardWrapper>

          {/* Direction Performance Bar */}
          <GlassCardWrapper patternId="direction-dots" className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Direction Performance
              </h3>
              <span className="text-sm font-display font-medium tabular-nums text-muted-foreground">
                {stats.longTrades.count + stats.shortTrades.count} trades
              </span>
            </div>
            <SegmentedBarChart
              data={[
                { 
                  name: `Long (${stats.longTrades.count})`, 
                  value: stats.longTrades.count, 
                  color: 'hsl(var(--pnl-positive))',
                  percentage: stats.totalTrades > 0 ? (stats.longTrades.count / stats.totalTrades) * 100 : 0
                },
                { 
                  name: `Short (${stats.shortTrades.count})`, 
                  value: stats.shortTrades.count, 
                  color: 'hsl(240, 91%, 65%)',
                  percentage: stats.totalTrades > 0 ? (stats.shortTrades.count / stats.totalTrades) * 100 : 0
                },
              ]}
              barHeight={14}
            />
          </GlassCardWrapper>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Profit Factor" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} icon={<Scale className="h-4 w-4" />} />
          <MetricCard label="Avg. R:R" value={`${stats.avgRR.toFixed(1)}R`} icon={<Crosshair className="h-4 w-4" />} />
          <MetricCard label="Avg. Stop Loss" value={stats.avgStopLossPips > 0 ? `${stats.avgStopLossPips.toFixed(1)} pips` : '—'} icon={<Target className="h-4 w-4" />} />
          <MetricCard label="Trades" value={stats.totalTrades.toString()} icon={<BarChart3 className="h-4 w-4" />} />
        </div>

        {/* Holding Time & Entry Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Holding Time Card - Grouped Bar Chart */}
          <GlassCardWrapper patternId="holding-time-dots" className="p-5">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Avg. Holding Time
            </h3>
            
            {stats.avgHoldingTimeWins !== '0m' || stats.avgHoldingTimeLosses !== '0m' ? <>
                {/* Summary Stats */}
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{
                  backgroundColor: profitColor
                }} />
                    <span className="text-xs text-muted-foreground">Winners:</span>
                    <span className="text-sm font-semibold text-pnl-positive">{stats.avgHoldingTimeWins}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{
                  backgroundColor: lossColor
                }} />
                    <span className="text-xs text-muted-foreground">Losers:</span>
                    <span className="text-sm font-semibold text-pnl-negative">{stats.avgHoldingTimeLosses}</span>
                  </div>
                </div>
                
                {/* Grouped Bar Chart */}
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={holdingTimeByDay} barCategoryGap="20%" barGap={2}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 11
                  }} dy={5} />
                      <YAxis hide />
                      <Tooltip cursor={false} contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--card-foreground))'
                  }} labelStyle={{
                    color: 'hsl(var(--card-foreground))',
                    fontWeight: 500
                  }} itemStyle={{
                    color: 'hsl(var(--card-foreground))'
                  }} formatter={(value: number, name: string) => [`${Math.floor(value / 60)}h ${Math.round(value % 60)}m`, name === 'wins' ? 'Winners' : 'Losers']} />
                      <Bar dataKey="wins" fill={profitColor} radius={[4, 4, 0, 0]} maxBarSize={24} />
                      <Bar dataKey="losses" fill={lossColor} radius={[4, 4, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </> : <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No holding time data available</p>
              </div>}
          </GlassCardWrapper>

          {/* Entry Time Analysis Card */}
          <GlassCardWrapper patternId="entry-time-dots" className="p-5">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Entry Time Range
            </h3>
            {entryTimeChartData.chartData.length > 0 ? <div style={{
            height: Math.max(160, entryTimeChartData.chartData.length * 32)
          }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={entryTimeChartData.chartData} layout="vertical" barCategoryGap="20%" margin={{
                left: 0,
                right: 10,
                top: 5,
                bottom: 5
              }}>
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  fontFamily: 'Outfit, system-ui, sans-serif',
                  fontWeight: 700
                }} tickFormatter={value => formatPnl(value, currencySymbol)} />
                    <YAxis type="category" dataKey="timeRange" axisLine={false} tickLine={false} tick={{
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 11,
                  style: {
                    whiteSpace: 'nowrap'
                  }
                }} width={90} />
                    <Tooltip cursor={false} contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'hsl(var(--card-foreground))'
                }} labelStyle={{
                  color: 'hsl(var(--card-foreground))'
                }} itemStyle={{
                  color: 'hsl(var(--card-foreground))'
                }} formatter={(value: number) => [formatPnl(value, currencySymbol), 'P&L']} labelFormatter={label => label} />
                    <Bar dataKey="pnl" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))">
                      {entryTimeChartData.chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? 'hsl(var(--pnl-positive))' : 'hsl(var(--pnl-negative))'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div> : <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">No entry time data available</p>
              </div>}
          </GlassCardWrapper>
        </div>

        {/* Strategy Profitability Bar */}
        <GlassCardWrapper patternId="strategy-dots" className="p-5">
          <h3 className="font-medium mb-4">Most Profitable Strategies</h3>
          {strategyProfitabilityData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No profitable strategies yet</p>
          ) : (
            <>
              {/* Stacked Horizontal Bar */}
              <div className="flex w-full h-3.5 overflow-hidden mb-4">
                {strategyProfitabilityData.map((strategy, index) => (
                  <div
                    key={strategy.name}
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${strategy.percentage}%`,
                      backgroundColor: strategy.color,
                      borderRadius: index === 0 ? '4px 0 0 4px' : index === strategyProfitabilityData.length - 1 ? '0 4px 4px 0' : '0',
                    }}
                    title={`${strategy.name}: ${strategy.percentage.toFixed(1)}%`}
                  />
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {strategyProfitabilityData.map((strategy) => (
                  <div key={strategy.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: strategy.color }}
                    />
                    <span className="text-xs text-muted-foreground">{strategy.name}</span>
                    <span className="text-xs font-display font-bold tabular-nums text-foreground">
                      {strategy.percentage.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCardWrapper>

        {/* Top Assets */}
        <GlassCardWrapper patternId="top-assets-dots" className="p-5">
          <h3 className="font-medium mb-4">Top Assets</h3>
          {topAssets.length === 0 ? <p className="text-sm text-muted-foreground">No profitable assets yet</p> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {topAssets.map(([symbol, pnl], index) => <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{index + 1}</span>
                    <span className="text-sm font-medium">{symbol}</span>
                  </div>
                  <span className={cn('text-sm font-display font-bold tabular-nums', pnl >= 0 ? 'text-pnl-positive' : 'text-pnl-negative')}>
                    {formatPnl(pnl, currencySymbol)}
                  </span>
                </div>)}
              </div>}
        </GlassCardWrapper>

        {/* Performance & Advanced Stats - Compact Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Trade Performance - Compact */}
          <GlassCardWrapper patternId="trade-perf-dots" className="p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Trade Performance</h3>
            <div className="space-y-1.5">
              <StatItemCompact label="Avg Win" value={`+${currencySymbol}${stats.avgWin.toFixed(0)}`} color="positive" />
              <StatItemCompact label="Avg Loss" value={`-${currencySymbol}${Math.abs(stats.avgLoss).toFixed(0)}`} color="negative" />
            </div>
          </GlassCardWrapper>
          
          <GlassCardWrapper patternId="bestworst-dots" className="p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Best & Worst</h3>
            <div className="space-y-1.5">
              <StatItemCompact label="Best" value={stats.bestTrade > 0 ? `+${currencySymbol}${stats.bestTrade.toFixed(0)}` : `${currencySymbol}0`} color={stats.bestTrade > 0 ? 'positive' : undefined} />
              <StatItemCompact label="Worst" value={stats.worstTrade < 0 ? `-${currencySymbol}${Math.abs(stats.worstTrade).toFixed(0)}` : `${currencySymbol}0`} color={stats.worstTrade < 0 ? 'negative' : undefined} />
            </div>
          </GlassCardWrapper>

          {/* Streaks - Compact */}
          <GlassCardWrapper patternId="streaks-dots" className="p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Streaks</h3>
            <div className="space-y-1.5">
              <StatItemCompact label="Win Streak" value={stats.consecutiveWins.toString()} color={stats.consecutiveWins > 0 ? 'positive' : undefined} />
              <StatItemCompact label="Loss Streak" value={stats.consecutiveLosses.toString()} color={stats.consecutiveLosses > 0 ? 'negative' : undefined} />
            </div>
          </GlassCardWrapper>
          
          <GlassCardWrapper patternId="frequency-dots" className="p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Frequency</h3>
            <div className="space-y-1.5">
              <StatItemCompact label="Trades/Week" value={(stats.totalTrades / 4).toFixed(1)} />
              <StatItemCompact label="Trade Freq." value={filteredTrades.length > 0 ? `${(filteredTrades.length / (timeFrame === 'Daily' ? 1 : timeFrame === 'Week' ? 7 : timeFrame === 'Month' ? 30 : 365)).toFixed(1)}/day` : '0/day'} />
            </div>
          </GlassCardWrapper>
        </div>

        {/* Rule Violations Heatmap - Compact Design */}
        <div className={cn("rounded-2xl border p-5 overflow-hidden relative transition-colors", emotionData.level === 1 && "bg-red-500/15 border-red-500/30 dark:bg-red-500/10 dark:border-red-500/20", emotionData.level === 2 && "bg-yellow-500/15 border-yellow-500/30 dark:bg-yellow-500/10 dark:border-yellow-500/20", emotionData.level === 3 && "bg-emerald-500/15 border-emerald-500/30 dark:bg-emerald-500/10 dark:border-emerald-500/20", !emotionData.level && "bg-card border-border")}>
          {/* Subtle gradient overlay */}
          <div className={cn("absolute inset-0 opacity-30", emotionData.level === 1 && "bg-gradient-to-br from-red-500/20 to-transparent", emotionData.level === 2 && "bg-gradient-to-br from-yellow-500/20 to-transparent", emotionData.level === 3 && "bg-gradient-to-br from-emerald-500/20 to-transparent")} />
          
          <div className="relative flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-muted-foreground">Avg. Emotion</h3>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", emotionData.level === 1 && "bg-red-500/30 border-red-500/50", emotionData.level === 2 && "bg-yellow-500/30 border-yellow-500/50", emotionData.level === 3 && "bg-emerald-500/30 border-emerald-500/50")}>
                <emotionData.icon className={cn("w-4 h-4", emotionData.level === 1 && "text-red-600 dark:text-red-400", emotionData.level === 2 && "text-yellow-600 dark:text-yellow-400", emotionData.level === 3 && "text-emerald-600 dark:text-emerald-400")} />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <span className={cn("text-2xl font-bold font-display", emotionData.level === 1 && "text-red-600 dark:text-red-400", emotionData.level === 2 && "text-yellow-600 dark:text-yellow-400", emotionData.level === 3 && "text-emerald-600 dark:text-emerald-400")}>
                {emotionData.label}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {emotionData.avgScore > 0 ? `${emotionData.avgScore.toFixed(1)}/3 avg rating` : 'No ratings yet'}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>;
}

// Glass Card Wrapper Component - applies nav-style glass effect
function GlassCardWrapper({
  children,
  className,
  patternId
}: {
  children: React.ReactNode;
  className?: string;
  patternId: string;
}) {
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  
  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-300 relative overflow-hidden",
      isGlassEnabled
        ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
        : "border-border/50 bg-card",
      className
    )}>
      {isGlassEnabled && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={patternId} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  
  return (
    <div className={cn(
      "rounded-xl border transition-all duration-300 p-4 relative overflow-hidden",
      isGlassEnabled
        ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
        : "border-border/50 bg-card shadow-sm"
    )}>
      {isGlassEnabled && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`metric-${label.replace(/\s/g, '-')}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#metric-${label.replace(/\s/g, '-')})`} />
        </svg>
      )}
      <div className="relative">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {icon}
          <span className="text-xs">{label}</span>
        </div>
        <p className="text-xl font-display font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}


// Stat Item Component
function StatItem({
  label,
  value,
  color,
  icon
}: {
  label: string;
  value: string;
  color?: 'positive' | 'negative';
  icon?: React.ReactNode;
}) {
  return <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className={cn('text-lg font-display font-bold tabular-nums', color === 'positive' && 'text-pnl-positive', color === 'negative' && 'text-pnl-negative')}>
        {value}
      </p>
    </div>;
}

// Compact Stat Item Component for single row layout
function StatItemCompact({
  label,
  value,
  color
}: {
  label: string;
  value: string;
  color?: 'positive' | 'negative';
}) {
  return <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-sm font-display font-bold tabular-nums text-foreground', color === 'positive' && 'text-pnl-positive', color === 'negative' && 'text-pnl-negative')}>
        {value}
      </p>
    </div>;
}