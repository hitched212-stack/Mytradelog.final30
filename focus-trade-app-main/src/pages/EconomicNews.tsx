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
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState('all');
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
          const filters = data.news_filters as { currency: string; impact: string; timeRange?: 'day' | 'week' };
          setCurrencyFilter(filters.currency || 'all');
          setImpactFilter(filters.impact || 'all');
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
  const filtersMatchSaved = currencyFilter === savedFilters.currency && impactFilter === savedFilters.impact && timeRangeFilter === savedFilters.timeRange;
  const hasActiveFilters = currencyFilter !== 'all' || impactFilter !== 'all' || timeRangeFilter !== 'day';

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
      const newFilters = { currency: currencyFilter, impact: impactFilter, timeRange: timeRangeFilter };
      
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
    setCurrencyFilter('all');
    setImpactFilter('all');
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
    return newsEvents.filter(event => {
      const eventDate = new Date(event.date);
      const matchesCurrency = currencyFilter === 'all' || event.currency === currencyFilter;
      const matchesImpact = impactFilter === 'all' || event.impact === impactFilter;
      
      // Time range filter
      let matchesTimeRange = true;
      if (timeRangeFilter === 'day') {
        matchesTimeRange = isSameDay(eventDate, selectedDate);
      } else if (timeRangeFilter === 'week') {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        matchesTimeRange = isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
      }
      
      return matchesCurrency && matchesImpact && matchesTimeRange;
    }).sort((a, b) => {
      // Sort by date first, then by time
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  }, [newsEvents, currencyFilter, impactFilter, timeRangeFilter, selectedDate]);

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
      {/* Header */}
      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Economic Calendar</h1>
            <p className="text-sm text-muted-foreground">Real-time market news & events</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-9 w-9"
          >
            <RefreshCw className={cn("h-5 w-5 text-muted-foreground", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="h-3 w-3" />
          <span>Last updated: {format(lastUpdated, 'HH:mm:ss')}</span>
          <span className="px-1.5 py-0.5 rounded bg-pnl-positive/20 text-pnl-positive text-[10px] font-medium">
            LIVE
          </span>
        </div>

        {/* Controls Row - Single Row Layout */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {/* Date picker - only show in day mode */}
          {timeRangeFilter === 'day' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal h-9",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM d, yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {/* Quick date navigation */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="h-9 w-9"
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="h-9 w-9"
              >
                →
              </Button>
            </>
          )}

          {/* Week navigation - only show in week mode */}
          {timeRangeFilter === 'week' && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('prev')}
                className="h-9 w-9"
              >
                ←
              </Button>
              <div className="flex items-center gap-2 px-3 h-9 rounded-xl border border-border/50 bg-card/50 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{getWeekRangeText()}</span>
                {isCurrentWeek() && (
                  <Badge variant="outline" className="text-[10px] bg-pnl-positive/20 text-pnl-positive border-pnl-positive/30">
                    Current
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateWeek('next')}
                className="h-9 w-9"
              >
                →
              </Button>
              {!isCurrentWeek() && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
                >
                  Go to current week
                </Button>
              )}
            </>
          )}

          {/* Time range dropdown */}
          <Select value={timeRangeFilter} onValueChange={(v: 'day' | 'week') => handleTimeRangeChange(v)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>

          {/* Currency filter */}
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_FILTERS.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Impact filter */}
          <Select value={impactFilter} onValueChange={setImpactFilter}>
            <SelectTrigger className="w-[130px] h-9 text-sm">
              <SelectValue placeholder="Impact" />
            </SelectTrigger>
            <SelectContent>
              {IMPACT_FILTERS.map(filter => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}

          {/* Save filters button */}
          <Button
            variant={filtersSaved ? "default" : "outline"}
            size="sm"
            onClick={saveFilters}
            disabled={filtersMatchSaved && !filtersSaved}
            className={cn(
              "h-9 gap-1.5",
              filtersSaved && "bg-emerald-500 hover:bg-emerald-600"
            )}
          >
            {filtersSaved ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        {/* News Events List */}
        <div className="relative min-h-[200px]">
          {isLoading ? (
            <div className="space-y-3 animate-fade-in">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className={cn(
              "flex flex-col items-center justify-center py-20 text-center rounded-2xl border animate-fade-in relative overflow-hidden",
              isGlassEnabled
                ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
                : "border-border/50 bg-card"
            )}>
              {/* Dot pattern - only show when glass is enabled */}
              {isGlassEnabled && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="news-empty-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                      <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.06]" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#news-empty-dots)" />
                </svg>
              )}
              <CalendarX2 className="h-12 w-12 text-muted-foreground/50 mb-4 relative" />
              <h2 className="text-lg font-medium mb-2 relative text-foreground">No events scheduled</h2>
              <p className="text-sm text-muted-foreground max-w-xs relative">
                {timeRangeFilter === 'week' 
                  ? 'No economic events found for this week with current filters'
                  : 'No economic events found for this day with current filters'}
              </p>
            </div>
          ) : (
            <div key={dataKey} className="space-y-6 animate-fade-in">
            {Object.entries(groupedEvents).map(([dateStr, events]) => (
              <div key={dateStr}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background py-2 z-10">
                  <CalendarIcon className="h-4 w-4 text-white/70" />
                  <span className="text-sm font-semibold text-foreground">
                    {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                  </span>
                  {isSameDay(new Date(dateStr), new Date()) && (
                    <Badge variant="outline" className="text-[10px] bg-pnl-positive/20 text-pnl-positive border-pnl-positive/30">
                      Today
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {events.map(event => {
                    const comparison = getActualVsForecast(event.actual, event.forecast);
                    // Check if event is in the past based on actual data OR time comparison
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
                    
                    // Check if event is happening NOW (within 15 minutes before or after event time)
                    const isLive = !isPast && eventDateTime && (() => {
                      const timeDiff = eventDateTime.getTime() - now.getTime();
                      const minutesDiff = timeDiff / (1000 * 60);
                      // Event is "live" if it's within -5 to +15 minutes of now
                      return minutesDiff >= -5 && minutesDiff <= 15;
                    })();
                    
                    return (
                      <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "rounded-2xl border p-3 md:p-4 transition-all duration-300 cursor-pointer overflow-hidden relative group",
                          "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                          isGlassEnabled
                            ? "bg-card/95 dark:bg-card/80 backdrop-blur-xl hover:bg-card"
                            : "bg-card hover:bg-muted/50",
                          isPast && "opacity-60",
                          // Live indicator styling - professional static glow
                          isLive 
                            ? "border-pnl-positive/60 shadow-sm shadow-pnl-positive/10" 
                            : "border-border/50"
                        )}
                      >
                        {/* Dot pattern - only show when glass is enabled */}
                        {isGlassEnabled && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id={`news-card-dots-${event.id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                                <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.04] dark:fill-foreground/[0.03]" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill={`url(#news-card-dots-${event.id})`} />
                          </svg>
                        )}
                        {/* Live indicator - just a pulsing dot in corner */}
                        {isLive && (
                          <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
                            <span className="inline-flex h-2 w-2 rounded-full bg-pnl-positive animate-pulse" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-2 md:gap-3 relative">
                          <div className="flex items-start gap-2 md:gap-3 flex-1 min-w-0">
                            {/* Currency Flag */}
                            <div className={cn("text-xl md:text-2xl flex-shrink-0", isPast && "grayscale")}>{getCurrencyFlag(event.currency)}</div>
                            
                            <div className="flex-1 min-w-0 overflow-hidden">
                              {/* Title Row */}
                              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mb-1">
                                <span className={cn(
                                  "font-semibold text-sm md:text-base truncate max-w-[140px] md:max-w-none",
                                  isPast ? "text-muted-foreground" : "text-foreground"
                                )}>
                                  {event.title}
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[9px] md:text-[10px] uppercase font-bold flex-shrink-0", 
                                    isPast ? "text-muted-foreground border-muted-foreground/30 bg-muted/20" : getImpactColor(event.impact)
                                  )}
                                >
                                  {event.impact === 'high' && <Star className={cn("h-2 w-2 md:h-2.5 md:w-2.5 mr-0.5", !isPast && "fill-current")} />}
                                  {event.impact}
                                </Badge>
                                <Info className="h-3 w-3 md:h-3.5 md:w-3.5 text-muted-foreground flex-shrink-0 hidden md:block" />
                              </div>
                              
                              {/* Country, Date & Time */}
                              <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs text-muted-foreground mb-2 flex-wrap md:flex-nowrap">
                                <span className="whitespace-nowrap">{event.country}</span>
                                <span className="hidden md:inline">•</span>
                                <span className="whitespace-nowrap">{format(new Date(event.date), 'MMM d')}</span>
                                <span className="hidden md:inline">•</span>
                                <span className={cn(
                                  "inline-flex items-center gap-0.5 md:gap-1 px-1.5 md:px-2 py-0.5 rounded-md font-semibold border whitespace-nowrap text-[10px] md:text-xs",
                                  isPast 
                                    ? "bg-muted/30 text-muted-foreground border-muted-foreground/20" 
                                    : "bg-primary/15 text-primary border-primary/20"
                                )}>
                                  <Clock className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
                                  {event.time}
                                </span>
                                <span className="px-1 md:px-1.5 py-0.5 rounded bg-muted text-[9px] md:text-[10px] font-medium whitespace-nowrap">
                                  {event.currency}
                                </span>
                              </div>
                              
                              {/* Forecast / Actual / Previous */}
                              <div className="flex flex-wrap gap-2 md:gap-3 text-[10px] md:text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Forecast:</span>
                                  <span className={cn("font-medium", isPast ? "text-muted-foreground" : "text-foreground")}>{event.forecast}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Previous:</span>
                                  <span className={cn("font-medium", isPast ? "text-muted-foreground" : "text-foreground")}>{event.previous}</span>
                                </div>
                                {event.actual && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Actual:</span>
                                    <span className={cn(
                                      "font-bold flex items-center gap-0.5",
                                      comparison === 'better' && "text-pnl-positive",
                                      comparison === 'worse' && "text-pnl-negative",
                                      comparison === 'neutral' && "text-muted-foreground"
                                    )}>
                                      {event.actual}
                                      {comparison === 'better' && <TrendingUp className="h-3 w-3" />}
                                      {comparison === 'worse' && <TrendingDown className="h-3 w-3" />}
                                      {comparison === 'neutral' && <Minus className="h-3 w-3" />}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Status Indicator */}
                          <div className="flex-shrink-0">
                            {isPast ? (
                              <div className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-muted text-[9px] md:text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                Released
                              </div>
                            ) : (
                              <div className="px-1.5 md:px-2 py-0.5 md:py-1 rounded-full bg-amber-500/20 text-[9px] md:text-[10px] font-medium text-amber-600 dark:text-amber-400 border border-amber-500/30 whitespace-nowrap">
                                Upcoming
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
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
