import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, RefreshCw, TrendingUp, TrendingDown, Minus, CalendarX2, Star, Info, Save, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, addDays, subDays, startOfWeek, endOfWeek, isWithinInterval, isSameDay } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';

// Currency pair groups for filtering
const CURRENCY_FILTERS = [
  { value: 'all', label: 'All Currencies' },
  { value: 'USD', label: 'USD Pairs' },
  { value: 'EUR', label: 'EUR Pairs' },
  { value: 'GBP', label: 'GBP Pairs' },
  { value: 'JPY', label: 'JPY Pairs' },
  { value: 'AUD', label: 'AUD Pairs' },
  { value: 'CAD', label: 'CAD Pairs' },
  { value: 'CHF', label: 'CHF Pairs' },
  { value: 'NZD', label: 'NZD Pairs' },
  { value: 'CNY', label: 'CNY Pairs' },
];

const IMPACT_FILTERS = [
  { value: 'all', label: 'All Impact' },
  { value: 'high', label: 'High Impact' },
  { value: 'medium', label: 'Medium Impact' },
  { value: 'low', label: 'Low Impact' },
];

interface NewsEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
  forecast: string;
  previous: string;
  actual: string | null;
  description: string;
  whyItMatters: string;
  higherThanExpected: string;
  asExpected: string;
  lowerThanExpected: string;
  // Legacy field for backwards compatibility
  marketImpact?: string;
}

const DEFAULT_FILTERS = { currency: 'all', impact: 'all', timeRange: 'day' as 'day' | 'week' };

// Session storage key for persisting date/time range
const NEWS_SESSION_KEY = 'economic-news-session';

interface NewsSession {
  selectedDate: string;
  timeRangeFilter: 'day' | 'week';
}

interface CacheEntry {
  data: NewsEvent[];
  timestamp: number;
}

// Cache expiry time (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

// Generate cache key for a date/range combination
const getCacheKey = (date: Date, range: 'day' | 'week'): string => {
  if (range === 'week') {
    const weekStart = startOfWeek(date, { weekStartsOn: 1 });
    return `week-${format(weekStart, 'yyyy-MM-dd')}`;
  }
  return `day-${format(date, 'yyyy-MM-dd')}`;
};

export default function EconomicNews() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(['all']);
  const [selectedImpacts, setSelectedImpacts] = useState<string[]>(['all']);
  const [savedFilters, setSavedFilters] = useState(DEFAULT_FILTERS);
  
  // Initialize from session storage to persist across page navigation
  const [timeRangeFilter, setTimeRangeFilter] = useState<'day' | 'week'>(() => {
    try {
      const saved = sessionStorage.getItem(NEWS_SESSION_KEY);
      if (saved) {
        const session: NewsSession = JSON.parse(saved);
        return session.timeRangeFilter;
      }
    } catch {}
    return 'day';
  });
  
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      const saved = sessionStorage.getItem(NEWS_SESSION_KEY);
      if (saved) {
        const session: NewsSession = JSON.parse(saved);
        return new Date(session.selectedDate);
      }
    } catch {}
    return new Date();
  });
  
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<NewsEvent | null>(null);
  const [filtersSaved, setFiltersSaved] = useState(false);
  const [dataKey, setDataKey] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cache for prefetched data
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Persist session state when date/timeRange changes
  useEffect(() => {
    const session: NewsSession = {
      selectedDate: selectedDate.toISOString(),
      timeRangeFilter
    };
    sessionStorage.setItem(NEWS_SESSION_KEY, JSON.stringify(session));
  }, [selectedDate, timeRangeFilter]);

  // Load saved filters from database on mount
  useEffect(() => {
    const loadFiltersFromDB = async () => {
      if (!user) {
        setIsLoadingFilters(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('news_filters')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (data?.news_filters) {
          const filters = data.news_filters as { currency: string[]; impact: string[]; timeRange?: 'day' | 'week' };
          setSelectedCurrencies(filters.currency || ['all']);
          setSelectedImpacts(filters.impact || ['all']);
          // Only apply saved timeRange if there's no session storage (first visit)
          const hasSession = sessionStorage.getItem(NEWS_SESSION_KEY);
          if (!hasSession && filters.timeRange) {
            setTimeRangeFilter(filters.timeRange);
          }
          setSavedFilters({ ...DEFAULT_FILTERS, ...filters });
        }
      } catch (error) {
        console.error('Error loading filters:', error);
      } finally {
        setIsLoadingFilters(false);
      }
    };

    loadFiltersFromDB();
  }, [user]);

  // Check if current filters match saved filters
  const filtersMatchSaved = JSON.stringify(selectedCurrencies) === JSON.stringify(savedFilters.currency) && JSON.stringify(selectedImpacts) === JSON.stringify(savedFilters.impact) && timeRangeFilter === savedFilters.timeRange;
  const hasActiveFilters = !selectedCurrencies.includes('all') || !selectedImpacts.includes('all') || timeRangeFilter !== 'day';

  // Save filters to database
  const saveFilters = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to save your filter preferences',
        variant: 'destructive',
      });
      return;
    }

    try {
      const newFilters = { currency: selectedCurrencies, impact: selectedImpacts, timeRange: timeRangeFilter };
      
      const { error } = await supabase
        .from('profiles')
        .update({ news_filters: newFilters })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setSavedFilters(newFilters);
      setFiltersSaved(true);
      toast({
        title: 'Filters saved',
        description: 'Your filter preferences have been saved and will sync across devices',
      });
      setTimeout(() => setFiltersSaved(false), 2000);
    } catch (error) {
      console.error('Error saving filters:', error);
      toast({
        title: 'Error',
        description: 'Failed to save filter preferences',
        variant: 'destructive',
      });
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCurrencies(['all']);
    setSelectedImpacts(['all']);
    setTimeRangeFilter('day');
    setSelectedDate(new Date());
  };

  // Fetch from API (internal, used by fetchNews)
  const fetchFromAPI = useCallback(async (dateToFetch: Date, range: 'day' | 'week'): Promise<NewsEvent[] | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('economic-calendar', {
        body: { 
          date: dateToFetch.toISOString(),
          range: range
        },
      });

      if (error) {
        console.error('Error fetching economic calendar:', error);
        return null;
      }

      if (data?.success && data?.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  }, []);

  // Prefetch adjacent dates in the background
  const prefetchAdjacent = useCallback(async (currentDate: Date, range: 'day' | 'week') => {
    const adjacentDates: Date[] = [];
    
    if (range === 'day') {
      adjacentDates.push(addDays(currentDate, 1), subDays(currentDate, 1));
    } else {
      adjacentDates.push(addDays(currentDate, 7), subDays(currentDate, 7));
    }

    for (const date of adjacentDates) {
      const key = getCacheKey(date, range);
      const cached = cacheRef.current.get(key);
      
      // Skip if already cached and not expired
      if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
        continue;
      }

      // Prefetch in background
      const data = await fetchFromAPI(date, range);
      if (data) {
        cacheRef.current.set(key, { data, timestamp: Date.now() });
      }
    }
  }, [fetchFromAPI]);

  // Fetch economic calendar data with caching
  const fetchNews = useCallback(async (dateToFetch: Date, range: 'day' | 'week', isRefresh = false) => {
    const cacheKey = getCacheKey(dateToFetch, range);
    const cached = cacheRef.current.get(cacheKey);
    
    // Use cache if available and not expired (unless refreshing)
    if (!isRefresh && cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      setNewsEvents(cached.data);
      setLastUpdated(new Date(cached.timestamp));
      setDataKey(prev => prev + 1);
      setIsLoading(false);
      setIsFetching(false);
      
      // Prefetch adjacent in background
      prefetchAdjacent(dateToFetch, range);
      return;
    }
    
    // Set loading only if no cache
    if (!cached && !isRefresh) {
      setIsLoading(true);
    }
    setIsFetching(true);
    
    const data = await fetchFromAPI(dateToFetch, range);
    
    if (data) {
      // Update cache
      cacheRef.current.set(cacheKey, { data, timestamp: Date.now() });
      
      setNewsEvents(data);
      setLastUpdated(new Date());
      setDataKey(prev => prev + 1);
      
      // Prefetch adjacent in background
      prefetchAdjacent(dateToFetch, range);
    } else if (!isRefresh) {
      toast({
        title: 'Error',
        description: 'Failed to fetch economic calendar data',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
    setIsFetching(false);
  }, [fetchFromAPI, prefetchAdjacent, toast]);

  // Fetch when date/range changes - no auto-refresh, only manual refresh
  useEffect(() => {
    fetchNews(selectedDate, timeRangeFilter, false);
  }, [selectedDate, timeRangeFilter, fetchNews]);

  const handleRefresh = () => {
    // Clear cache for current view to force fresh fetch
    const cacheKey = getCacheKey(selectedDate, timeRangeFilter);
    cacheRef.current.delete(cacheKey);
    setIsLoading(true);
    fetchNews(selectedDate, timeRangeFilter, true);
  };

  // Handle time range change
  const handleTimeRangeChange = (range: 'day' | 'week') => {
    setTimeRangeFilter(range);
    if (range === 'day') {
      setSelectedDate(new Date());
    }
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7;
    setSelectedDate(addDays(selectedDate, days));
  };

  // Get week range display text
  const getWeekRangeText = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
  };

  // Check if current week
  const isCurrentWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return isWithinInterval(today, { start: weekStart, end: weekEnd });
  };

  // Filter news events
  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return newsEvents.filter(event => {
      const eventDate = new Date(event.date);
      const eventCurrency = (event.currency || '').trim().toUpperCase();
      const eventImpact = (event.impact || '').toString().trim().toLowerCase();
      const matchesCurrency = selectedCurrencies.includes('all') || selectedCurrencies.includes(eventCurrency);
      const matchesImpact = selectedImpacts.includes('all') || selectedImpacts.includes(eventImpact);
      const matchesSearch = !query || [
        event.title,
        eventCurrency,
        event.country,
        event.description,
        event.time,
      ]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(query));
      
      // Time range filter
      let matchesTimeRange = true;
      if (timeRangeFilter === 'day') {
        matchesTimeRange = isSameDay(eventDate, selectedDate);
      } else if (timeRangeFilter === 'week') {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        matchesTimeRange = isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
      }
      
      return matchesCurrency && matchesImpact && matchesTimeRange && matchesSearch;
    }).sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [newsEvents, selectedCurrencies, selectedImpacts, timeRangeFilter, selectedDate, searchQuery]);

  // Group events by date for display
  const groupedEvents = useMemo(() => {
    const groups: Record<string, NewsEvent[]> = {};
    filteredEvents.forEach(event => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getActualVsForecast = (actual: string | null, forecast: string) => {
    if (!actual) return null;
    
    const actualNum = parseFloat(actual.replace(/[^0-9.-]/g, ''));
    const forecastNum = parseFloat(forecast.replace(/[^0-9.-]/g, ''));
    
    if (isNaN(actualNum) || isNaN(forecastNum)) return 'neutral';
    if (actualNum > forecastNum) return 'better';
    if (actualNum < forecastNum) return 'worse';
    return 'neutral';
  };

  const renderEventRow = (event: NewsEvent, index: number, total: number) => {
    const now = new Date();
    const eventDate = new Date(event.date);

    // Parse event time to get exact datetime
    let eventDateTime: Date | null = null;
    if (event.time !== 'All Day' && event.time !== 'Tentative') {
      const [time, period] = event.time.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      eventDateTime = new Date(eventDate);
      eventDateTime.setHours(hour24, minutes || 0, 0, 0);
    }

    const isTimePast = eventDateTime ? eventDateTime < now : eventDate < new Date(now.toDateString());
    const isPast = event.actual !== null || isTimePast;

    const isLive = !isPast && eventDateTime && (() => {
      const timeDiff = eventDateTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      return minutesDiff >= -5 && minutesDiff <= 15;
    })();

    const impactLineClass = event.impact === 'high'
      ? "bg-red-500"
      : event.impact === 'medium'
        ? "bg-orange-500"
        : "bg-yellow-500";

    return (
      <div key={event.id} className="flex gap-4 group cursor-pointer">
        {/* Timeline Column */}
        <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
          <div className={cn(
            "text-xs font-semibold whitespace-nowrap w-12 text-center",
            isLive ? "text-white" : "text-foreground"
          )}>
            {event.time}
          </div>
          <div className={cn(
            "w-0.5 h-12 mt-2 rounded-full",
            isLive ? "bg-red-500" : impactLineClass
          )} />
        </div>

        {/* Event Card */}
        <div
          onClick={() => setSelectedEvent(event)}
          className={cn(
            "flex-1 rounded-2xl border transition-all duration-200 cursor-pointer",
            "p-4",
            isPast && "opacity-50",
            isLive
              ? "border-white/20 bg-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          )}
        >
          {/* Title and Currency/Flag/Impact */}
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <span className="font-semibold text-base text-white flex-1">
              {event.title}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={cn(
                "inline-flex h-2 w-2 rounded-full flex-shrink-0",
                isLive
                  ? "bg-red-500 animate-pulse"
                  : event.impact === 'high' ? "bg-red-500" :
                  event.impact === 'medium' ? "bg-orange-500" :
                  "bg-white/30"
              )} />
              <span className="text-lg">{getCurrencyFlag(event.currency)}</span>
              <span className="text-xs font-semibold text-muted-foreground">
                {event.currency}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
            {event.description}
          </p>
        </div>
      </div>
    );
  };

  const getCurrencyFlag = (currency: string) => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      AUD: '🇦🇺',
      CAD: '🇨🇦',
      CHF: '🇨🇭',
      NZD: '🇳🇿',
    };
    return flags[currency] || '🌍';
  };

  // Show full skeleton while loading filters or initial data
  if (isLoadingFilters || (isLoading && newsEvents.length === 0)) {
    return (
      <div className="min-h-screen pb-24">
        <div className="px-4 py-6 md:px-6 lg:px-8">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton className="h-6 w-48 mb-2 bg-muted/50" />
              <Skeleton className="h-4 w-36 bg-muted/30" />
            </div>
            <Skeleton className="h-9 w-9 rounded-md bg-muted/40" />
          </div>
          
          {/* Last Updated skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-3 w-3 rounded-full bg-muted/40" />
            <Skeleton className="h-4 w-32 bg-muted/30" />
            <Skeleton className="h-4 w-10 rounded bg-pnl-positive/20" />
          </div>
          
          {/* Controls skeleton */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Skeleton className="h-9 w-32 rounded-md bg-muted/40" />
            <Skeleton className="h-9 w-9 rounded-md bg-muted/30" />
            <Skeleton className="h-9 w-9 rounded-md bg-muted/30" />
            <Skeleton className="h-9 w-24 rounded-md bg-muted/40" />
            <Skeleton className="h-9 w-28 rounded-md bg-muted/40" />
            <Skeleton className="h-9 w-32 rounded-md bg-muted/40" />
          </div>
          
          {/* News events skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/80 p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg bg-muted/50" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-5 w-40 bg-muted/50" />
                      <Skeleton className="h-4 w-12 rounded bg-muted/40" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Skeleton className="h-3 w-16 bg-muted/30" />
                      <Skeleton className="h-3 w-20 bg-muted/30" />
                      <Skeleton className="h-5 w-16 rounded-md bg-muted/40" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-20 bg-muted/30" />
                      <Skeleton className="h-4 w-20 bg-muted/30" />
                      <Skeleton className="h-4 w-20 bg-muted/30" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 animate-in fade-in duration-300">
      {/* Header with title and refresh */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Economic Calendar</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-60" />
            <div className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.25)] focus-within:border-white/30">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, currency, or country"
                className="w-full bg-transparent text-foreground placeholder-gray-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Dropdown */}
        <div className="mb-6 sm:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <button className="w-full px-4 py-3 rounded-2xl bg-white/5 text-foreground border border-white/10 flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-2rem)] max-w-sm p-4 rounded-2xl bg-background/95 border border-white/10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Time</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedDate(subDays(new Date(), 1))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        isSameDay(selectedDate, subDays(new Date(), 1))
                          ? "bg-white text-black"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        isSameDay(selectedDate, new Date())
                          ? "bg-white text-black"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setSelectedDate(addDays(new Date(), 1))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        isSameDay(selectedDate, addDays(new Date(), 1))
                          ? "bg-white text-black"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Tomorrow
                    </button>
                    <button
                      onClick={() => handleTimeRangeChange('week')}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        timeRangeFilter === 'week'
                          ? "bg-white text-black"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      Week
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Day</p>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 7 }, (_, i) => {
                      const day = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i);
                      const isSelected = isSameDay(day, selectedDate);
                      return (
                        <button
                          key={format(day, 'yyyy-MM-dd')}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "h-10 rounded-xl flex flex-col items-center justify-center text-[11px] transition-all",
                            isSelected
                              ? "border border-white bg-white/10 text-white"
                              : "border border-white/5 bg-white/5 text-gray-400"
                          )}
                        >
                          <span className="text-[10px]">{format(day, 'EEE')}</span>
                          <span className="text-sm font-medium leading-none">{format(day, 'd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">Impact</p>
                  <div className="flex flex-wrap gap-2">
                    {IMPACT_FILTERS.map(filter => {
                      const isSelected = filter.value === 'all' 
                        ? selectedImpacts.includes('all')
                        : selectedImpacts.includes(filter.value);
                      const selectedClass = filter.value === 'high'
                        ? "bg-red-500/20 text-red-300 border border-red-500/40"
                        : filter.value === 'medium'
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                          : filter.value === 'low'
                            ? "bg-white/10 text-gray-200 border border-white/20"
                            : "bg-white text-black";
                      return (
                        <button
                          key={filter.value}
                          onClick={() => {
                            if (filter.value === 'all') {
                              setSelectedImpacts(['all']);
                            } else if (selectedImpacts.includes('all')) {
                              setSelectedImpacts([filter.value]);
                            } else if (isSelected) {
                              const updated = selectedImpacts.filter(v => v !== filter.value);
                              setSelectedImpacts(updated.length === 0 ? ['all'] : updated);
                            } else {
                              setSelectedImpacts([...selectedImpacts.filter(v => v !== 'all'), filter.value]);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                            isSelected
                              ? selectedClass
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          {filter.label.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground font-medium">Currency</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'].map((curr) => {
                      const isSelected = curr === 'All'
                        ? selectedCurrencies.includes('all')
                        : selectedCurrencies.includes(curr);
                      return (
                        <button
                          key={curr}
                          onClick={() => {
                            if (curr === 'All') {
                              setSelectedCurrencies(['all']);
                            } else if (selectedCurrencies.includes('all')) {
                              setSelectedCurrencies([curr]);
                            } else if (isSelected) {
                              const updated = selectedCurrencies.filter(v => v !== curr);
                              setSelectedCurrencies(updated.length === 0 ? ['all'] : updated);
                            } else {
                              setSelectedCurrencies([...selectedCurrencies.filter(v => v !== 'all'), curr]);
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                            isSelected
                              ? "bg-white text-black"
                              : "bg-white/5 text-gray-400 hover:bg-white/10"
                          )}
                        >
                          {curr !== 'All' && <span className="text-sm">{getCurrencyFlag(curr)}</span>}
                          {curr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Period Buttons */}
        <div className="hidden sm:flex gap-2 sm:gap-3 mb-6 justify-center flex-wrap">
          <button
            onClick={() => setSelectedDate(subDays(new Date(), 1))}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              isSameDay(selectedDate, subDays(new Date(), 1))
                ? "bg-white text-black shadow"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            Yesterday
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              isSameDay(selectedDate, new Date())
                ? "bg-white text-black shadow"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedDate(addDays(new Date(), 1))}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              isSameDay(selectedDate, addDays(new Date(), 1))
                ? "bg-white text-black shadow"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            Tomorrow
          </button>
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
              timeRangeFilter === 'week'
                ? "bg-white text-black shadow"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            Week
          </button>
        </div>

        {/* Week Day Selector - always show */}
        <div className="hidden sm:flex mb-8 gap-1.5 sm:gap-2 justify-center overflow-x-auto pb-2 px-2 scrollbar-hide">
          {Array.from({ length: 7 }, (_, i) => {
            const day = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "h-14 sm:h-16 min-w-[60px] sm:min-w-[70px] rounded-2xl flex flex-col items-center justify-center transition-all flex-shrink-0",
                  isSelected 
                    ? "border-2 border-white bg-white/10 text-white"
                    : "border border-white/5 bg-white/5 text-gray-400 hover:text-white"
                )}
              >
                <span className="text-xs font-medium mb-0.5 sm:mb-1">{format(day, 'EEE')}</span>
                <span className="text-xl sm:text-2xl font-medium">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>

        {/* Impact Filter Pills */}
        <div className="hidden sm:flex mb-6 items-center gap-4">
          <p className="text-xs text-muted-foreground font-medium min-w-fit">Impact</p>
          <div className="flex gap-2">
            {IMPACT_FILTERS.map(filter => {
              const isSelected = filter.value === 'all' 
                ? selectedImpacts.includes('all')
                : selectedImpacts.includes(filter.value);
              const selectedClass = filter.value === 'high'
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : filter.value === 'medium'
                  ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                  : filter.value === 'low'
                    ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                    : "bg-white text-black";
              return (
                <button
                  key={filter.value}
                  onClick={() => {
                    if (filter.value === 'all') {
                      setSelectedImpacts(['all']);
                    } else if (selectedImpacts.includes('all')) {
                      setSelectedImpacts([filter.value]);
                    } else if (isSelected) {
                      const updated = selectedImpacts.filter(v => v !== filter.value);
                      setSelectedImpacts(updated.length === 0 ? ['all'] : updated);
                    } else {
                      setSelectedImpacts([...selectedImpacts.filter(v => v !== 'all'), filter.value]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    isSelected
                      ? selectedClass
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {filter.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Currency Filter Pills */}
        <div className="hidden sm:flex mb-8 items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground font-medium">Currency</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {['All', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD', 'CNY'].map((curr) => {
              const isSelected = curr === 'All'
                ? selectedCurrencies.includes('all')
                : selectedCurrencies.includes(curr);
              return (
                <button
                  key={curr}
                  onClick={() => {
                    if (curr === 'All') {
                      setSelectedCurrencies(['all']);
                    } else if (selectedCurrencies.includes('all')) {
                      setSelectedCurrencies([curr]);
                    } else if (isSelected) {
                      const updated = selectedCurrencies.filter(v => v !== curr);
                      setSelectedCurrencies(updated.length === 0 ? ['all'] : updated);
                    } else {
                      setSelectedCurrencies([...selectedCurrencies.filter(v => v !== 'all'), curr]);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                    isSelected
                      ? "bg-white text-black"
                      : "bg-white/5 text-gray-400 hover:bg-white/10"
                  )}
                >
                  {curr !== 'All' && <span className="text-sm">{getCurrencyFlag(curr)}</span>}
                  {curr}
                </button>
              );
            })}
          </div>
        </div>

        {/* News Events Timeline */}
        <div className="relative">
          {isLoading && filteredEvents.length === 0 ? (
            <div className="space-y-4 animate-fade-in">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-6 w-12 flex-shrink-0" />
                  <Skeleton className="h-24 flex-1 rounded-lg" />
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-16 text-center rounded-2xl border animate-fade-in relative overflow-hidden",
              isGlassEnabled
                ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                : "border-border/50 bg-card"
            )}>
              <CalendarX2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h2 className="text-lg font-medium mb-2 text-foreground">No events found</h2>
              <p className="text-sm text-muted-foreground">
                {timeRangeFilter === 'week' 
                  ? 'No economic events for this week with current filters'
                  : 'No economic events for today with current filters'}
              </p>
            </div>
          ) : (
            <div key={dataKey} className="space-y-6 animate-fade-in">
              {timeRangeFilter === 'week' ? (
                Object.entries(groupedEvents)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([date, events]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-foreground">
                          {format(new Date(date), 'EEEE, MMM d')}
                        </p>
                        <div className="h-px flex-1 bg-white/10" />
                      </div>
                      <div className="space-y-4">
                        {events.map((event, index) => renderEventRow(event, index, events.length))}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event, index) => renderEventRow(event, index, filteredEvents.length))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-2xl">{selectedEvent && getCurrencyFlag(selectedEvent.currency)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span>{selectedEvent?.title}</span>
                  {selectedEvent && (
                    <Badge 
                      variant="outline" 
                      className={cn("text-[10px] uppercase font-bold", getImpactColor(selectedEvent.impact))}
                    >
                      {selectedEvent.impact}
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-normal text-muted-foreground mt-1">
                  {selectedEvent?.country} • {selectedEvent?.currency}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-5 mt-2">
              {/* Event Details Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Forecast</p>
                  <p className="font-semibold text-foreground">{selectedEvent.forecast}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Previous</p>
                  <p className="font-semibold text-foreground">{selectedEvent.previous}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Actual</p>
                  <p className={cn(
                    "font-semibold",
                    selectedEvent.actual 
                      ? getActualVsForecast(selectedEvent.actual, selectedEvent.forecast) === 'better'
                        ? "text-pnl-positive"
                        : getActualVsForecast(selectedEvent.actual, selectedEvent.forecast) === 'worse'
                          ? "text-pnl-negative"
                          : "text-foreground"
                      : "text-muted-foreground"
                  )}>
                    {selectedEvent.actual || 'Pending'}
                  </p>
                </div>
              </div>

              {/* What This News Is */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  What This News Is
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Why It Matters */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  Why It Matters
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedEvent.whyItMatters || selectedEvent.marketImpact || 'This data provides insight into economic conditions and can influence market sentiment.'}
                </p>
              </div>

              {/* Possible Outcomes */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Possible Outcomes</h4>
                
                {/* Higher Than Expected */}
                <div className="p-3 rounded-lg bg-pnl-positive/10 border border-pnl-positive/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="h-4 w-4 text-pnl-positive" />
                    <span className="text-xs font-semibold text-pnl-positive">Higher Than Expected</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedEvent.higherThanExpected || 'A better-than-expected result often signals economic strength and can be positive for the currency.'}
                  </p>
                </div>

                {/* As Expected */}
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Minus className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">About As Expected</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedEvent.asExpected || 'When data matches expectations, markets may show limited reaction as the result was already priced in.'}
                  </p>
                </div>

                {/* Lower Than Expected */}
                <div className="p-3 rounded-lg bg-pnl-negative/10 border border-pnl-negative/20">
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingDown className="h-4 w-4 text-pnl-negative" />
                    <span className="text-xs font-semibold text-pnl-negative">Lower Than Expected</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedEvent.lowerThanExpected || 'A weaker-than-expected result may signal economic challenges and can lead to currency weakness.'}
                  </p>
                </div>
              </div>

              {/* Timing */}
              <div className="flex items-center gap-4 pt-2 border-t border-border text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{format(new Date(selectedEvent.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedEvent.time} UTC</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
