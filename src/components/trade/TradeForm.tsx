import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Trade, TradeDirection, TradeCategory, TradeStatus, TRADE_CATEGORIES, getCurrencySymbol, NewsImpact, NEWS_IMPACTS, NewsEvent } from '@/types/trade';
import { useTrades } from '@/hooks/useTrades';
import { useSettings } from '@/hooks/useSettings';
import { usePreferences } from '@/hooks/usePreferences';
import { useTradingPreferences } from '@/hooks/useTradingPreferences';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast, dismissAllToasts } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ImageUpload } from './ImageUpload';
import { NewsEventSelector } from './NewsEventSelector';
import { cn } from '@/lib/utils';
import { Calendar, Loader2, X, Plus, Meh, Frown, Smile, Check, XIcon, ClipboardList } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';
import { ALL_TIMEFRAMES, getFilteredTimeframes, getTimeframeLabel } from '@/lib/timeframes';
import { TradeTypeSwitch } from '@/components/ui/TradeTypeSwitch';
import { TradeStatusSwitch } from '@/components/ui/TradeStatusSwitch';
type TabType = 'general' | 'chart-analysis' | 'pre-market-forecast' | 'post-market-forecast' | 'emotions';

// Validation schema for trade form
const tradeFormSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').max(20, 'Symbol must be less than 20 characters'),
  direction: z.enum(['long', 'short']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  holdingTime: z.string().max(50, 'Exit date too long').optional().or(z.literal('')),
  lotSize: z.number().min(0, 'Lot size cannot be negative').max(10000000, 'Lot size is too large'),
  performanceGrade: z.number().int().min(1, 'Grade must be 1-3').max(3, 'Grade must be 1-3'),
  entryPrice: z.number().min(0, 'Entry price cannot be negative').max(10000000, 'Entry price is too large'),
  stopLoss: z.number().min(0, 'Stop loss cannot be negative').max(10000000, 'Stop loss is too large'),
  stopLossPips: z.number().min(0, 'SL pips cannot be negative').max(100000, 'SL pips is too large').optional(),
  takeProfit: z.number().min(0, 'Take profit cannot be negative').max(10000000, 'Take profit is too large'),
  riskRewardRatio: z.string().max(20, 'R:R ratio too long').optional().or(z.literal('')),
  pnlAmount: z.number().min(-100000000, 'P&L amount is too small').max(100000000, 'P&L amount is too large'),
  pnlPercentage: z.number().min(-10000, 'P&L percentage is too small').max(10000, 'P&L percentage is too large'),
  emotionalState: z.number().min(1, 'Emotional state must be 1-5').max(5, 'Emotional state must be 1-5'),
  preMarketPlan: z.string().max(5000, 'Pre-market plan is too long').optional().or(z.literal('')),
  postMarketReview: z.string().max(5000, 'Post-market review is too long').optional().or(z.literal('')),
  emotionalJournalBefore: z.string().max(2000, 'Journal entry is too long').optional().or(z.literal('')),
  emotionalJournalDuring: z.string().max(2000, 'Journal entry is too long').optional().or(z.literal('')),
  emotionalJournalAfter: z.string().max(2000, 'Journal entry is too long').optional().or(z.literal('')),
  strategy: z.string().max(100, 'Strategy name is too long').optional().or(z.literal('')),
  category: z.enum(['stocks', 'futures', 'forex', 'crypto', 'options']),
  images: z.array(z.string()).max(20, 'Too many images'),
  preMarketImages: z.array(z.string()).max(20, 'Too many images').optional(),
  postMarketImages: z.array(z.string()).max(20, 'Too many images').optional(),
  chartAnalysisNotes: z.string().max(10000, 'Notes too long').optional(),
  preMarketNotes: z.string().max(10000, 'Notes too long').optional(),
  postMarketNotes: z.string().max(10000, 'Notes too long').optional(),
  forecastId: z.string().uuid().nullable().optional(),
  followedRules: z.boolean().optional(),
  notes: z.string().max(5000, 'Notes too long').optional().or(z.literal(''))
});
interface ChartAnalysis {
  id: string;
  timeframe: string;
  images: string[];
  notes: string;
}

// Timeframes are now loaded from cloud-synced user settings via hook in component
const EMOTION_LABELS = [{
  value: 1,
  label: 'Disappointed',
  icon: Frown,
  color: 'text-red-500',
  bgColor: 'bg-red-500/20 text-red-500'
}, {
  value: 2,
  label: 'Indifferent',
  icon: Meh,
  color: 'text-yellow-500',
  bgColor: 'bg-yellow-500/20 text-yellow-500'
}, {
  value: 3,
  label: 'Proud',
  icon: Smile,
  color: 'text-emerald-500',
  bgColor: 'bg-emerald-500/20 text-emerald-500'
}];
interface TradeFormProps {
  editTrade?: Trade;
}
export function TradeForm({
  editTrade
}: TradeFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultDate = searchParams.get('date');
  const {
    addTrade,
    updateTrade
  } = useTrades();
  const {
    settings
  } = useSettings();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const { selectedTimeframes } = useTradingPreferences();
  const timeframeOptions = getFilteredTimeframes(selectedTimeframes);
  const {
    toast
  } = useToast();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    direction: 'long' as TradeDirection,
    date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
    entryTime: format(new Date(), 'HH:mm'),
    holdingTime: '',
    lotSize: '',
    performanceGrade: '2' as string,
    entryPrice: '',
    stopLoss: '',
    stopLossPips: '',
    takeProfit: '',
    riskRewardRatio: '',
    pnlAmount: '',
    pnlPercentage: '',
    preMarketPlan: '',
    postMarketReview: '',
    emotionalJournalBefore: '',
    emotionalJournalDuring: '',
    emotionalJournalAfter: '',
    overallEmotions: '',
    emotionalState: 2 as number,
    strategy: '',
    category: 'stocks' as TradeCategory,
    forecastId: null as string | null,
    followedRules: true,
    followedRulesList: [] as string[],
    brokenRules: [] as string[],
    notes: '',
    hasNews: false,
    newsEvents: [{ id: crypto.randomUUID(), type: '', impact: '' as NewsImpact | '', time: '', currency: '' }] as NewsEvent[],
    isPaperTrade: false,
    noTradeTaken: false,
    status: 'closed' as TradeStatus
  });

  // News events management
  const addNewsEvent = () => {
    setFormData(p => ({
      ...p,
      newsEvents: [...p.newsEvents, { id: crypto.randomUUID(), type: '', impact: '' as NewsImpact | '', time: '', currency: '' }]
    }));
  };

  const updateNewsEvent = (id: string, field: keyof NewsEvent, value: string) => {
    setFormData(p => ({
      ...p,
      newsEvents: p.newsEvents.map(event => 
        event.id === id ? { ...event, [field]: value } : event
      )
    }));
  };

  const removeNewsEvent = (id: string) => {
    if (formData.newsEvents.length > 1) {
      setFormData(p => ({
        ...p,
        newsEvents: p.newsEvents.filter(event => event.id !== id)
      }));
    }
  };

  // Get trading rules from cloud-synced preferences
  const { tradingRules } = useTradingPreferences();

  // Dismiss all toasts when component unmounts (navigating away)
  useEffect(() => {
    return () => {
      dismissAllToasts();
    };
  }, []);
  // Chart Before and Chart After arrays
  const [beforeCharts, setBeforeCharts] = useState<ChartAnalysis[]>([{
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  }]);
  const [afterCharts, setAfterCharts] = useState<ChartAnalysis[]>([{
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  }]);
  const [preMarketCharts, setPreMarketCharts] = useState<ChartAnalysis[]>([{
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  }]);
  const [postMarketCharts, setPostMarketCharts] = useState<ChartAnalysis[]>([{
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  }]);
  const createEmptyChart = (): ChartAnalysis => ({
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  });
  // Before charts management
  const addBeforeChart = () => {
    setBeforeCharts([...beforeCharts, createEmptyChart()]);
  };
  const updateBeforeChart = (id: string, field: keyof ChartAnalysis, value: any) => {
    setBeforeCharts(beforeCharts.map(chart => chart.id === id ? {
      ...chart,
      [field]: value
    } : chart));
  };
  const removeBeforeChart = (id: string) => {
    if (beforeCharts.length > 1) {
      setBeforeCharts(beforeCharts.filter(chart => chart.id !== id));
    }
  };

  // After charts management
  const addAfterChart = () => {
    setAfterCharts([...afterCharts, createEmptyChart()]);
  };
  const updateAfterChart = (id: string, field: keyof ChartAnalysis, value: any) => {
    setAfterCharts(afterCharts.map(chart => chart.id === id ? {
      ...chart,
      [field]: value
    } : chart));
  };
  const removeAfterChart = (id: string) => {
    if (afterCharts.length > 1) {
      setAfterCharts(afterCharts.filter(chart => chart.id !== id));
    }
  };

  // Pre-market forecast chart management
  const addPreMarketChart = () => {
    setPreMarketCharts([...preMarketCharts, createEmptyChart()]);
  };
  const updatePreMarketChart = (id: string, field: keyof ChartAnalysis, value: any) => {
    setPreMarketCharts(preMarketCharts.map(chart => chart.id === id ? {
      ...chart,
      [field]: value
    } : chart));
  };
  const removePreMarketChart = (id: string) => {
    if (preMarketCharts.length > 1) {
      setPreMarketCharts(preMarketCharts.filter(chart => chart.id !== id));
    }
  };

  // Post-market forecast chart management
  const addPostMarketChart = () => {
    setPostMarketCharts([...postMarketCharts, createEmptyChart()]);
  };
  const updatePostMarketChart = (id: string, field: keyof ChartAnalysis, value: any) => {
    setPostMarketCharts(postMarketCharts.map(chart => chart.id === id ? {
      ...chart,
      [field]: value
    } : chart));
  };
  const removePostMarketChart = (id: string) => {
    if (postMarketCharts.length > 1) {
      setPostMarketCharts(postMarketCharts.filter(chart => chart.id !== id));
    }
  };

  // Helper function to parse notes with timeframes into chart sections
  // Returns { before: ChartAnalysis[], after: ChartAnalysis[] } for chart analysis notes
  // or just ChartAnalysis[] for pre/post market notes
  const parseNotesToCharts = (notes: string | undefined, images: string[], splitBeforeAfter = false): ChartAnalysis[] => {
    if (!notes && images.length === 0) {
      return [createEmptyChart()];
    }
    const chartSections: ChartAnalysis[] = [];
    if (notes) {
      const sections = notes.split(/\n\n+/);
      sections.forEach(section => {
        const match = section.match(/^\[([^\]]+)\]\n?([\s\S]*)/);
        if (match) {
          const label = match[1];
          const noteText = match[2]?.trim() || '';
          // Extract timeframe from formats like "Before - 5 Minutes", "After - 1 Hour", or just "5 Minutes"
          let timeframeLabel = label;
          if (label.toLowerCase().startsWith('before')) {
            const tfMatch = label.match(/Before\s*-?\s*(.+)/i);
            timeframeLabel = tfMatch?.[1]?.trim() || label;
          } else if (label.toLowerCase().startsWith('after')) {
            const tfMatch = label.match(/After\s*-?\s*(.+)/i);
            timeframeLabel = tfMatch?.[1]?.trim() || label;
          }
          const timeframeValue = ALL_TIMEFRAMES.find(tf => tf.label === timeframeLabel)?.value || '4h';
          chartSections.push({
            id: crypto.randomUUID(),
            timeframe: timeframeValue,
            images: [],
            notes: noteText
          });
        } else if (section.trim()) {
          chartSections.push({
            id: crypto.randomUUID(),
            timeframe: '4h',
            images: [],
            notes: section.trim()
          });
        }
      });
    }
    images.forEach((img, idx) => {
      if (chartSections[idx]) {
        chartSections[idx].images = [img];
      } else {
        chartSections.push({
          id: crypto.randomUUID(),
          timeframe: '4h',
          images: [img],
          notes: ''
        });
      }
    });
    return chartSections.length > 0 ? chartSections : [createEmptyChart()];
  };

  // Parse chart analysis notes respecting Before/After markers
  const parseChartAnalysisNotes = (notes: string | undefined, images: string[]): { before: ChartAnalysis[], after: ChartAnalysis[] } => {
    if (!notes && images.length === 0) {
      return { before: [createEmptyChart()], after: [createEmptyChart()] };
    }
    const beforeCharts: ChartAnalysis[] = [];
    const afterCharts: ChartAnalysis[] = [];
    
    if (notes) {
      const sections = notes.split(/\n\n+/);
      sections.forEach(section => {
        const match = section.match(/^\[([^\]]+)\]\n?([\s\S]*)/);
        if (match) {
          const label = match[1];
          const noteText = match[2]?.trim() || '';
          const isBefore = label.toLowerCase().startsWith('before');
          const isAfter = label.toLowerCase().startsWith('after');
          
          // Extract timeframe from formats like "Before - 5 Minutes", "After - 1 Hour"
          let timeframeLabel = label;
          if (isBefore) {
            const tfMatch = label.match(/Before\s*-?\s*(.+)/i);
            timeframeLabel = tfMatch?.[1]?.trim() || label;
          } else if (isAfter) {
            const tfMatch = label.match(/After\s*-?\s*(.+)/i);
            timeframeLabel = tfMatch?.[1]?.trim() || label;
          }
          
          const timeframeValue = ALL_TIMEFRAMES.find(tf => tf.label === timeframeLabel)?.value || '4h';
          const chartEntry: ChartAnalysis = {
            id: crypto.randomUUID(),
            timeframe: timeframeValue,
            images: [],
            notes: noteText
          };
          
          if (isBefore) {
            beforeCharts.push(chartEntry);
          } else if (isAfter) {
            afterCharts.push(chartEntry);
          } else {
            // Legacy format - assume before
            beforeCharts.push(chartEntry);
          }
        } else if (section.trim()) {
          beforeCharts.push({
            id: crypto.randomUUID(),
            timeframe: '4h',
            images: [],
            notes: section.trim()
          });
        }
      });
    }
    
    // Distribute images between before and after based on parsed sections count
    const beforeCount = beforeCharts.length || 1;
    const beforeImages = images.slice(0, beforeCount);
    const afterImages = images.slice(beforeCount);
    
    beforeImages.forEach((img, idx) => {
      if (beforeCharts[idx]) {
        beforeCharts[idx].images = [img];
      } else {
        beforeCharts.push({
          id: crypto.randomUUID(),
          timeframe: '4h',
          images: [img],
          notes: ''
        });
      }
    });
    
    afterImages.forEach((img, idx) => {
      if (afterCharts[idx]) {
        afterCharts[idx].images = [img];
      } else {
        afterCharts.push({
          id: crypto.randomUUID(),
          timeframe: '4h',
          images: [img],
          notes: ''
        });
      }
    });
    
    return {
      before: beforeCharts.length > 0 ? beforeCharts : [createEmptyChart()],
      after: afterCharts.length > 0 ? afterCharts : [createEmptyChart()]
    };
  };
  useEffect(() => {
    if (editTrade) {
      setFormData({
        symbol: editTrade.symbol,
        direction: editTrade.direction,
        date: editTrade.date,
        entryTime: editTrade.entryTime,
        holdingTime: editTrade.holdingTime,
        lotSize: editTrade.lotSize.toString(),
        performanceGrade: editTrade.performanceGrade.toString(),
        entryPrice: editTrade.entryPrice.toString(),
        stopLoss: editTrade.stopLoss.toString(),
        stopLossPips: editTrade.stopLossPips?.toString() || '',
        takeProfit: editTrade.takeProfit.toString(),
        riskRewardRatio: editTrade.riskRewardRatio,
        pnlAmount: editTrade.pnlAmount.toString(),
        pnlPercentage: editTrade.pnlPercentage.toString(),
        preMarketPlan: editTrade.preMarketPlan,
        postMarketReview: editTrade.postMarketReview,
        emotionalJournalBefore: editTrade.emotionalJournalBefore,
        emotionalJournalDuring: editTrade.emotionalJournalDuring,
        emotionalJournalAfter: editTrade.emotionalJournalAfter,
        overallEmotions: editTrade.overallEmotions || '',
        emotionalState: editTrade.emotionalState || 2,
        strategy: editTrade.strategy || '',
        category: editTrade.category || 'stocks',
        forecastId: editTrade.forecastId || null,
        followedRules: editTrade.followedRules ?? true,
        followedRulesList: editTrade.followedRulesList || [],
        brokenRules: editTrade.brokenRules || [],
        notes: editTrade.notes || '',
        hasNews: editTrade.hasNews ?? false,
        newsEvents: editTrade.newsEvents && editTrade.newsEvents.length > 0 
          ? editTrade.newsEvents 
          : editTrade.newsType 
            ? [{ id: crypto.randomUUID(), type: editTrade.newsType, impact: editTrade.newsImpact || '', time: editTrade.newsTime || '' }]
            : [{ id: crypto.randomUUID(), type: '', impact: '' as NewsImpact | '', time: '' }],
        isPaperTrade: editTrade.isPaperTrade ?? false,
        noTradeTaken: editTrade.noTradeTaken ?? false,
        status: editTrade.status || 'closed'
      });
      const chartAnalysisImages = editTrade.images || [];
      const chartAnalysisNotes = editTrade.chartAnalysisNotes || '';
      // Parse before/after charts from notes using proper Before/After markers
      const { before: beforeParsed, after: afterParsed } = parseChartAnalysisNotes(chartAnalysisNotes, chartAnalysisImages);
      setBeforeCharts(beforeParsed);
      setAfterCharts(afterParsed);
      const preMarketImages = editTrade.preMarketImages || [];
      const preMarketNotes = editTrade.preMarketNotes || '';
      setPreMarketCharts(parseNotesToCharts(preMarketNotes, preMarketImages));
      const postMarketImages = editTrade.postMarketImages || [];
      const postMarketNotes = editTrade.postMarketNotes || '';
      setPostMarketCharts(parseNotesToCharts(postMarketNotes, postMarketImages));
    }
  }, [editTrade]);
  const handlePnlAmountChange = (value: string) => {
    setFormData(prev => {
      const pnlAmount = parseFloat(value) || 0;
      const accountBalance = settings.accountBalance || 0;
      let pnlPercentage = prev.pnlPercentage;
      if (accountBalance > 0 && value !== '') {
        pnlPercentage = (pnlAmount / accountBalance * 100).toFixed(2);
      }
      return {
        ...prev,
        pnlAmount: value,
        pnlPercentage
      };
    });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    if (name === 'pnlAmount') {
      handlePnlAmountChange(value);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol.trim()) {
      toast({
        title: 'Symbol required',
        description: 'Please select a trading symbol.',
        variant: 'destructive'
      });
      return;
    }
    setIsSubmitting(true);
    const chartAnalysisImages = [...beforeCharts.flatMap(c => c.images), ...afterCharts.flatMap(c => c.images)];
    const preMarketImages = preMarketCharts.flatMap(c => c.images);
    const postMarketImages = postMarketCharts.flatMap(c => c.images);
    // Always save timeframe markers for charts with images, even if no notes
    const beforeNotes = beforeCharts.filter(c => c.images.length > 0 || c.notes.trim()).map(c => `[Before - ${getTimeframeLabel(c.timeframe)}]\n${c.notes}`).join('\n\n');
    const afterNotes = afterCharts.filter(c => c.images.length > 0 || c.notes.trim()).map(c => `[After - ${getTimeframeLabel(c.timeframe)}]\n${c.notes}`).join('\n\n');
    const allChartNotes = [beforeNotes, afterNotes].filter(Boolean).join('\n\n');
    // Always save timeframe markers for charts with images, even if no notes (same pattern as beforeCharts/afterCharts)
    const allPreMarketNotes = preMarketCharts.filter(c => c.images.length > 0 || c.notes.trim()).map(c => `[${getTimeframeLabel(c.timeframe)}]\n${c.notes}`).join('\n\n');
    const allPostMarketNotes = postMarketCharts.filter(c => c.images.length > 0 || c.notes.trim()).map(c => `[${getTimeframeLabel(c.timeframe)}]\n${c.notes}`).join('\n\n');
    const tradeData = {
      symbol: formData.symbol.toUpperCase().trim(),
      direction: formData.direction,
      date: formData.date,
      entryTime: formData.entryTime,
      holdingTime: formData.holdingTime,
      lotSize: parseFloat(formData.lotSize) || 0,
      performanceGrade: parseInt(formData.performanceGrade) || 3,
      entryPrice: parseFloat(formData.entryPrice) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      stopLossPips: formData.stopLossPips ? parseFloat(formData.stopLossPips) : undefined,
      takeProfit: parseFloat(formData.takeProfit) || 0,
      riskRewardRatio: formData.riskRewardRatio,
      pnlAmount: parseFloat(formData.pnlAmount) || 0,
      pnlPercentage: parseFloat(formData.pnlPercentage) || 0,
      preMarketPlan: formData.preMarketPlan,
      postMarketReview: formData.postMarketReview,
      emotionalJournalBefore: formData.emotionalJournalBefore,
      emotionalJournalDuring: formData.emotionalJournalDuring,
      emotionalJournalAfter: formData.emotionalJournalAfter,
      overallEmotions: formData.overallEmotions,
      emotionalState: formData.emotionalState,
      strategy: formData.strategy || undefined,
      category: formData.category,
      images: chartAnalysisImages,
      preMarketImages: preMarketImages,
      postMarketImages: postMarketImages,
      chartAnalysisNotes: allChartNotes,
      preMarketNotes: allPreMarketNotes,
      postMarketNotes: allPostMarketNotes,
      forecastId: formData.forecastId,
      followedRules: formData.followedRules,
      notes: formData.notes,
      hasNews: formData.hasNews,
      newsEvents: formData.newsEvents.filter(e => e.type || e.impact || e.time),
      isPaperTrade: formData.isPaperTrade,
      noTradeTaken: formData.noTradeTaken,
      status: formData.status
    };
    const validationResult = tradeFormSchema.safeParse(tradeData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError?.message || 'Please check your input values.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
      return;
    }
    const validatedData = {
      symbol: validationResult.data.symbol,
      direction: validationResult.data.direction,
      date: validationResult.data.date,
      entryTime: validationResult.data.entryTime,
      holdingTime: validationResult.data.holdingTime || '',
      lotSize: validationResult.data.lotSize,
      performanceGrade: validationResult.data.performanceGrade as 1 | 2 | 3,
      entryPrice: validationResult.data.entryPrice,
      stopLoss: validationResult.data.stopLoss,
      stopLossPips: validationResult.data.stopLossPips,
      takeProfit: validationResult.data.takeProfit,
      riskRewardRatio: validationResult.data.riskRewardRatio || '',
      pnlAmount: validationResult.data.pnlAmount,
      pnlPercentage: validationResult.data.pnlPercentage,
      preMarketPlan: validationResult.data.preMarketPlan || '',
      postMarketReview: validationResult.data.postMarketReview || '',
      emotionalJournalBefore: validationResult.data.emotionalJournalBefore || '',
      emotionalJournalDuring: validationResult.data.emotionalJournalDuring || '',
      emotionalJournalAfter: validationResult.data.emotionalJournalAfter || '',
      overallEmotions: formData.overallEmotions || '',
      emotionalState: validationResult.data.emotionalState,
      strategy: validationResult.data.strategy || undefined,
      category: validationResult.data.category,
      images: chartAnalysisImages,
      preMarketImages: preMarketImages,
      postMarketImages: postMarketImages,
      chartAnalysisNotes: allChartNotes,
      preMarketNotes: allPreMarketNotes,
      postMarketNotes: allPostMarketNotes,
      forecastId: validationResult.data.forecastId || null,
      followedRules: validationResult.data.followedRules ?? true,
      followedRulesList: formData.followedRulesList,
      brokenRules: formData.brokenRules,
      notes: validationResult.data.notes || '',
      hasNews: formData.hasNews,
      newsEvents: formData.newsEvents.filter(e => e.type || e.impact || e.time),
      isPaperTrade: formData.isPaperTrade,
      noTradeTaken: formData.noTradeTaken,
      status: formData.status
    };
    try {
      if (editTrade) {
        await updateTrade(editTrade.id, validatedData);
        toast({
          title: 'Trade updated successfully',
          variant: 'success'
        });
      } else {
        await addTrade(validatedData);
        toast({
          title: 'Trade saved successfully',
          variant: 'success'
        });
      }
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving trade:', error);
      toast({
        title: 'Error saving trade',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const getInitialTab = (): TabType => {
    const urlTab = searchParams.get('tab');
    const tabMap: Record<string, TabType> = {
      'general': 'general',
      'charts': 'chart-analysis',
      'pre-market': 'pre-market-forecast',
      'post-market': 'post-market-forecast',
      'emotions': 'emotions'
    };
    return tabMap[urlTab || ''] || 'general';
  };
  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab);
  return <form onSubmit={handleSubmit} className="w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className={cn(
        "md:rounded-xl border-0 md:border shadow-xl flex flex-col flex-1 min-h-0 relative overflow-hidden",
        isGlassEnabled
          ? "border-border/50 bg-card/95 dark:bg-card/80 md:backdrop-blur-xl"
          : "border-border/50 bg-card md:backdrop-blur-xl"
      )} onClick={(e) => e.stopPropagation()}>
        {/* Dot pattern - only show when glass is enabled */}
        {isGlassEnabled && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tradeform-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tradeform-dots)" />
          </svg>
        )}
        {/* Header with safe area padding for mobile app */}
        <div className="px-4 md:px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-border/50 bg-muted/50 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">
              {editTrade ? 'Edit Trade' : 'Add Trade'}
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={() => {
              dismissAllToasts();
              navigate('/dashboard');
            }} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tab Navigation - Modern Segmented Control - Centered on all viewports */}
          <div className="flex justify-center">
            <div className="flex items-center gap-0.5 p-1 rounded-full bg-muted overflow-x-auto scrollbar-hide w-fit border border-border">
              <button type="button" onClick={() => setActiveTab('general')} className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0", activeTab === 'general' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                Overview
              </button>
              <button type="button" onClick={() => setActiveTab('chart-analysis')} className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0", activeTab === 'chart-analysis' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                Chart
              </button>
              <button type="button" onClick={() => setActiveTab('pre-market-forecast')} className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0", activeTab === 'pre-market-forecast' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                Plan
              </button>
              <button type="button" onClick={() => setActiveTab('post-market-forecast')} className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0", activeTab === 'post-market-forecast' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                Review
              </button>
              <button type="button" onClick={() => setActiveTab('emotions')} className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0", activeTab === 'emotions' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                Mindset
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div 
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 pb-24 md:py-8 md:pb-8 overscroll-y-contain touch-pan-y min-h-0 relative z-10"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {/* Trade Type Selector - Smooth Switch */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">Trade Type</span>
                <TradeTypeSwitch
                  isPaperTrade={formData.isPaperTrade}
                  noTradeTaken={formData.noTradeTaken}
                  onChange={(isPaperTrade, noTradeTaken) => 
                    setFormData(p => ({ ...p, isPaperTrade, noTradeTaken }))
                  }
                />
              </div>

              {/* Trade Status Switch - Open/Closed */}
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Status</Label>
                <TradeStatusSwitch
                  isOpen={formData.status === 'open'}
                  onChange={(isOpen) => setFormData(p => ({ ...p, status: isOpen ? 'open' : 'closed' }))}
                />
              </div>

              {/* Type (Buy/Sell Toggle) */}
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData(p => ({
                ...p,
                direction: 'long'
              }))} className={cn("h-10 rounded-lg text-sm font-medium transition-all duration-200 border", formData.direction === 'long' ? "bg-pnl-positive/15 text-pnl-positive border-pnl-positive/30" : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground")}>
                    Buy (long)
                  </button>
                  <button type="button" onClick={() => setFormData(p => ({
                ...p,
                direction: 'short'
              }))} className={cn("h-10 rounded-lg text-sm font-medium transition-all duration-200 border", formData.direction === 'short' ? "bg-pnl-negative/15 text-pnl-negative border-pnl-negative/30" : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground")}>
                    Sell (short)
                  </button>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Date & Time</Label>
                <div className="flex rounded-lg border border-border bg-muted/50 overflow-hidden">
                  <input id="date" name="date" type="date" value={formData.date} onChange={e => setFormData(p => ({
                ...p,
                date: e.target.value
              }))} className="flex-1 h-11 bg-transparent text-sm px-3 text-foreground focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                  <div className="w-px bg-border" />
                  <input id="entryTime" name="entryTime" type="time" value={formData.entryTime} onChange={e => setFormData(p => ({
                ...p,
                entryTime: e.target.value
              }))} className="flex-1 h-11 bg-transparent text-sm px-3 text-foreground focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-50 dark:[&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>

              {/* Symbol */}
              <div className="space-y-1.5">
                <Label htmlFor="symbol" className="text-sm text-foreground">Symbol *</Label>
                <Input id="symbol" name="symbol" value={formData.symbol} onChange={e => setFormData(p => ({
              ...p,
              symbol: e.target.value.toUpperCase()
            }))} placeholder="e.g. AAPL, EUR/USD" className="bg-muted/50 border-border text-sm text-foreground placeholder:text-muted-foreground uppercase focus:border-ring" />
              </div>

              {/* P&L */}
              <div className="space-y-1.5">
                <Label htmlFor="pnlAmount" className="text-sm text-foreground">Gross P&L ({currencySymbol})</Label>
                <Input id="pnlAmount" name="pnlAmount" type="number" step="0.01" value={formData.pnlAmount} onChange={handleChange} placeholder="+500 or -250" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground tabular-nums text-sm focus:border-ring" />
              </div>

              {/* Hold Time & R:R */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="holdingTime" className="text-sm text-foreground">Hold Time</Label>
                  <Input id="holdingTime" name="holdingTime" value={formData.holdingTime} onChange={handleChange} placeholder="e.g. 2h 30m" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-ring" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="riskRewardRatio" className="text-sm text-foreground">Risk:Reward</Label>
                  <Input id="riskRewardRatio" name="riskRewardRatio" value={formData.riskRewardRatio} onChange={handleChange} placeholder="e.g. 1:2" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-ring" />
                </div>
              </div>

              {/* Lot Size */}
              <div className="space-y-1.5">
                <Label htmlFor="lotSize" className="text-sm text-foreground">Lot Size</Label>
                <Input id="lotSize" name="lotSize" type="number" step="0.01" value={formData.lotSize} onChange={handleChange} placeholder="0" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground tabular-nums text-sm focus:border-ring" />
              </div>

              {/* Entry, TP & SL */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="entryPrice" className="text-sm text-foreground">Entry Price</Label>
                  <Input id="entryPrice" name="entryPrice" type="number" step="0.0001" value={formData.entryPrice} onChange={handleChange} placeholder="0" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground tabular-nums text-sm focus:border-ring" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="takeProfit" className="text-sm text-foreground">Take Profit</Label>
                  <Input id="takeProfit" name="takeProfit" type="number" step="0.01" value={formData.takeProfit} onChange={handleChange} placeholder="0" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground tabular-nums text-sm focus:border-ring" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stopLoss" className="text-sm text-foreground">Stop Loss</Label>
                  <Input id="stopLoss" name="stopLoss" type="number" step="0.01" value={formData.stopLoss} onChange={handleChange} placeholder="0" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground tabular-nums text-sm focus:border-ring" />
                </div>
              </div>

              {/* SL Pips */}
              <div className="space-y-1.5">
                <Label htmlFor="stopLossPips" className="text-sm text-foreground">SL (Pips/Points)</Label>
                <Input id="stopLossPips" name="stopLossPips" type="number" step="0.1" value={formData.stopLossPips} onChange={handleChange} placeholder="e.g. 15" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground tabular-nums text-sm focus:border-ring" />
              </div>

              {/* Followed Rules */}
              <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium text-foreground">Followed Rules</Label>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData(p => ({
                    ...p,
                    followedRules: true
                  }))} className={cn("h-10 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 hover:scale-[1.02]", formData.followedRules ? "bg-pnl-positive/15 text-pnl-positive border-pnl-positive/30" : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground")}>
                    <Check className="h-4 w-4" />
                    Yes
                  </button>
                  <button type="button" onClick={() => setFormData(p => ({
                    ...p,
                    followedRules: false
                  }))} className={cn("h-10 rounded-lg text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2 hover:scale-[1.02]", !formData.followedRules ? "bg-pnl-negative/15 text-pnl-negative border-pnl-negative/30" : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground")}>
                    <XIcon className="h-4 w-4" />
                    No
                  </button>
                </div>

                {/* Followed Rules Selection - Only show when followedRules is true */}
                {formData.followedRules && (
                  <div className="space-y-3 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <Label className="text-sm text-muted-foreground">Which rules did you follow?</Label>
                    {tradingRules.length > 0 ? (
                      <div className="space-y-2">
                        {tradingRules.map((rule, index) => {
                          const isSelected = formData.followedRulesList.includes(rule);
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                setFormData(p => ({
                                  ...p,
                                  followedRulesList: isSelected 
                                    ? p.followedRulesList.filter(r => r !== rule)
                                    : [...p.followedRulesList, rule]
                                }));
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border flex items-center gap-2 hover:scale-[1.02]",
                                isSelected 
                                  ? "bg-pnl-positive/10 text-pnl-positive border-pnl-positive/30" 
                                  : "bg-muted/50 text-foreground border-border hover:bg-muted"
                              )}
                            >
                              <div className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                                isSelected 
                                  ? "bg-pnl-positive border-pnl-positive" 
                                  : "border-muted-foreground"
                              )}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="flex-1">{rule}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No rules configured. Add rules in Settings → Trading Rules.
                      </p>
                    )}
                  </div>
                )}

                {/* Broken Rules Selection - Only show when followedRules is false */}
                {!formData.followedRules && (
                  <div className="space-y-3 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <Label className="text-sm text-muted-foreground">Which rules did you break?</Label>
                    {(() => {
                      // Filter out rules that were already marked as followed
                      const availableRules = tradingRules.filter(rule => !formData.followedRulesList.includes(rule));
                      
                      if (tradingRules.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground italic">
                            No rules configured. Add rules in Settings → Trading Rules.
                          </p>
                        );
                      }
                      
                      if (availableRules.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground italic">
                            All rules were followed. Switch to "Yes" to modify followed rules.
                          </p>
                        );
                      }
                      
                      return (
                        <div className="space-y-2">
                          {availableRules.map((rule, index) => {
                            const isSelected = formData.brokenRules.includes(rule);
                            return (
                              <button
                                key={index}
                                type="button"
                                onClick={() => {
                                  setFormData(p => ({
                                    ...p,
                                    brokenRules: isSelected 
                                      ? p.brokenRules.filter(r => r !== rule)
                                      : [...p.brokenRules, rule]
                                  }));
                                }}
                                className={cn(
                                  "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 border flex items-center gap-2 hover:scale-[1.02]",
                                  isSelected 
                                    ? "bg-pnl-negative/10 text-pnl-negative border-pnl-negative/30" 
                                    : "bg-muted/50 text-foreground border-border hover:bg-muted"
                                )}
                              >
                                <div className={cn(
                                  "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                                  isSelected 
                                    ? "bg-pnl-negative border-pnl-negative" 
                                    : "border-muted-foreground"
                                )}>
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <span className="flex-1">{rule}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Performance Grade */}
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Performance Grade</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(grade => {
                    const isSelected = parseInt(formData.performanceGrade) === grade;
                    const gradeColors: Record<number, {
                      selected: string;
                      text: string;
                      label: string;
                    }> = {
                      1: {
                        selected: 'bg-red-500/15 border-red-500/30',
                        text: 'text-red-500',
                        label: 'Poor'
                      },
                      2: {
                        selected: 'bg-amber-500/15 border-amber-500/30',
                        text: 'text-amber-500',
                        label: 'Average'
                      },
                      3: {
                        selected: 'bg-pnl-positive/15 border-pnl-positive/30',
                        text: 'text-pnl-positive',
                        label: 'Excellent'
                      }
                    };
                    const colors = gradeColors[grade];
                    return (
                      <button 
                        key={grade} 
                        type="button" 
                        onClick={() => setFormData(p => ({
                          ...p,
                          performanceGrade: grade.toString()
                        }))} 
                        className={cn(
                          "h-10 rounded-lg text-sm font-medium transition-all duration-200 border hover:scale-[1.02]", 
                          isSelected ? `${colors.selected} ${colors.text}` : "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                        )}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Category</Label>
                <Select value={formData.category} onValueChange={(value: TradeCategory) => setFormData(p => ({
              ...p,
              category: value
            }))}>
                  <SelectTrigger className="h-9 bg-muted/50 border-border text-foreground text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRADE_CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Strategy */}
              <div className="space-y-1.5">
                <Label htmlFor="strategy" className="text-sm text-foreground">Strategy</Label>
                <Input id="strategy" name="strategy" value={formData.strategy} onChange={handleChange} placeholder="e.g., Breakout, Scalping" className="h-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground text-sm focus:border-ring" />
              </div>

              {/* News Section */}
              <NewsEventSelector
                date={formData.date || null}
                hasNews={formData.hasNews}
                selectedEvents={formData.newsEvents.filter(e => e.type).map(e => ({
                  title: e.type,
                  impact: e.impact,
                  currency: e.currency,
                  time: e.time,
                }))}
                onHasNewsChange={(hasNews) => setFormData(p => ({
                  ...p,
                  hasNews,
                  newsEvents: hasNews ? p.newsEvents : [{ id: crypto.randomUUID(), type: '', impact: '' as NewsImpact | '', time: '', currency: '' }]
                }))}
                onNewsSelect={(title, impact) => {
                  // Legacy single select - only used as fallback
                  if (!title && !impact) {
                    setFormData(p => ({ ...p, newsEvents: [] }));
                  }
                }}
                onMultiNewsSelect={(events) => setFormData(p => ({
                  ...p,
                  newsEvents: events.map((e, idx) => ({
                    id: p.newsEvents[idx]?.id || crypto.randomUUID(),
                    type: e.title,
                    impact: e.impact as NewsImpact | '',
                    time: e.time || '',
                    currency: e.currency || '',
                  }))
                }))}
              />

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm text-foreground">Notes</Label>
                <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Add any additional notes about this trade..." rows={4} className="bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-sm focus:border-ring" />
              </div>
            </div>}

          {/* CHART ANALYSIS TAB */}
          {activeTab === 'chart-analysis' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {/* Chart Before Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-semibold text-foreground px-2">Chart Before</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addBeforeChart} className="h-7 text-xs ml-3 transition-all duration-200 hover:scale-[1.02]">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Chart
                  </Button>
                </div>
                
                {beforeCharts.map((chart, index) => (
                  <div key={chart.id} className="space-y-3 p-4 rounded-lg border border-border bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <Select value={chart.timeframe} onValueChange={v => updateBeforeChart(chart.id, 'timeframe', v)}>
                        <SelectTrigger className="w-28 h-7 bg-background border-border text-xs">
                          <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeframeOptions.map(tf => <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {beforeCharts.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeBeforeChart(chart.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <ImageUpload images={chart.images} onChange={images => updateBeforeChart(chart.id, 'images', images)} maxImages={5} timeframeLabel={getTimeframeLabel(chart.timeframe)} />
                    <Textarea 
                      placeholder="Your analysis notes for chart before trade..." 
                      value={chart.notes} 
                      onChange={e => updateBeforeChart(chart.id, 'notes', e.target.value)} 
                      className="min-h-[60px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-sm focus:border-ring" 
                    />
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
              </div>

              {/* Chart After Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-semibold text-foreground px-2">Chart After</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addAfterChart} className="h-7 text-xs ml-3 transition-all duration-200 hover:scale-[1.02]">
                    <Plus className="mr-1 h-3 w-3" />
                    Add Chart
                  </Button>
                </div>
                
                {afterCharts.map((chart, index) => (
                  <div key={chart.id} className="space-y-3 p-4 rounded-lg border border-border bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <Select value={chart.timeframe} onValueChange={v => updateAfterChart(chart.id, 'timeframe', v)}>
                        <SelectTrigger className="w-28 h-7 bg-background border-border text-xs">
                          <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeframeOptions.map(tf => <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {afterCharts.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeAfterChart(chart.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <ImageUpload images={chart.images} onChange={images => updateAfterChart(chart.id, 'images', images)} maxImages={5} timeframeLabel={getTimeframeLabel(chart.timeframe)} />
                    <Textarea 
                      placeholder="Your analysis notes for chart after trade..." 
                      value={chart.notes} 
                      onChange={e => updateAfterChart(chart.id, 'notes', e.target.value)} 
                      className="min-h-[60px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-sm focus:border-ring" 
                    />
                  </div>
                ))}
              </div>
            </div>}

          {/* PRE MARKET FORECAST TAB */}
          {activeTab === 'pre-market-forecast' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Pre Market Forecast</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPreMarketChart} className="h-7 text-xs transition-all duration-200 hover:scale-[1.02]">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Chart
                </Button>
              </div>

              {preMarketCharts.map(chart => (
                <div key={chart.id} className="space-y-3 p-4 rounded-lg border border-border bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Select value={chart.timeframe} onValueChange={v => updatePreMarketChart(chart.id, 'timeframe', v)}>
                      <SelectTrigger className="w-28 h-7 bg-background border-border text-xs">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframeOptions.map(tf => <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {preMarketCharts.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removePreMarketChart(chart.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <ImageUpload images={chart.images} onChange={images => updatePreMarketChart(chart.id, 'images', images)} maxImages={5} timeframeLabel={getTimeframeLabel(chart.timeframe)} />
                  <Textarea 
                    placeholder="Your pre-market analysis and forecast notes..." 
                    value={chart.notes} 
                    onChange={e => updatePreMarketChart(chart.id, 'notes', e.target.value)} 
                    className="min-h-[60px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-sm focus:border-ring" 
                  />
                </div>
              ))}

              {/* Pre-trade Analysis */}
              
            </div>}

          {/* POST MARKET FORECAST TAB */}
          {activeTab === 'post-market-forecast' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-foreground">Post Market Review</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPostMarketChart} className="h-7 text-xs transition-all duration-200 hover:scale-[1.02]">
                  <Plus className="mr-1 h-3 w-3" />
                  Add Chart
                </Button>
              </div>

              {postMarketCharts.map(chart => (
                <div key={chart.id} className="space-y-3 p-4 rounded-lg border border-border bg-secondary/50">
                  <div className="flex items-center gap-2">
                    <Select value={chart.timeframe} onValueChange={v => updatePostMarketChart(chart.id, 'timeframe', v)}>
                      <SelectTrigger className="w-28 h-7 bg-background border-border text-xs">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeframeOptions.map(tf => <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {postMarketCharts.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removePostMarketChart(chart.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <ImageUpload images={chart.images} onChange={images => updatePostMarketChart(chart.id, 'images', images)} maxImages={5} timeframeLabel={getTimeframeLabel(chart.timeframe)} />
                  <Textarea 
                    placeholder="Your post-market review and what actually happened..." 
                    value={chart.notes} 
                    onChange={e => updatePostMarketChart(chart.id, 'notes', e.target.value)} 
                    className="min-h-[60px] bg-background border-border text-foreground placeholder:text-muted-foreground resize-none text-sm focus:border-ring" 
                  />
                </div>
              ))}

              {/* Post-trade Analysis */}
              
            </div>}

          {/* EMOTIONS TAB */}
          {activeTab === 'emotions' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {/* Emotional State Rating - Redesigned */}
              <div className="space-y-4 p-4 md:p-5 rounded-xl border border-border/50 bg-card">
                <Label className="text-sm font-semibold text-foreground">How are you feeling?</Label>
                
              {/* Emotion Selector Pills */}
                <div className="grid grid-cols-3 gap-2">
                  {EMOTION_LABELS.map((emotion) => {
                    const Icon = emotion.icon;
                    const isSelected = Math.round(formData.emotionalState) === emotion.value;
                    return (
                      <button
                        key={emotion.value}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, emotionalState: emotion.value }))}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02]",
                          isSelected 
                            ? `${emotion.bgColor} border-current shadow-sm` 
                            : "border-border/50 bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors",
                          isSelected ? "bg-background/80" : "bg-background/50"
                        )}>
                          <Icon className={cn(
                            "w-4 h-4 md:w-5 md:h-5 transition-colors",
                            emotion.color
                          )} />
                        </div>
                        <span className={cn(
                          "text-[9px] md:text-[10px] font-medium transition-colors text-center leading-tight",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {emotion.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overall Emotions */}
              <div className="p-4 rounded-xl border border-border/50 bg-card">
                <span className="text-xs font-medium text-muted-foreground mb-3 block">Overall Emotions</span>
                <Textarea name="overallEmotions" value={formData.overallEmotions} onChange={handleChange} placeholder="Describe your emotions and thoughts about this trade..." rows={4} className="bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground resize-none text-sm" />
              </div>
            </div>}

          {/* Hidden fields for advanced data */}
          <input type="hidden" name="pnlPercentage" value={formData.pnlPercentage} />
        </div>

        {/* Footer - fixed at bottom on mobile, inline for desktop */}
        <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto px-4 md:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border/50 bg-card/95 backdrop-blur-xl flex-shrink-0 z-50">
          <Button type="submit" className="w-full h-11 md:h-10 text-sm rounded-lg font-medium transition-all duration-200 hover:scale-[1.02]" disabled={isSubmitting}>
            {isSubmitting ? <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {editTrade ? 'Updating...' : 'Saving...'}
              </> : editTrade ? 'Update Trade' : 'Log Trade'}
          </Button>
        </div>
      </div>
    </form>;
}