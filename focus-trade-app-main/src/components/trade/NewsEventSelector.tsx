import { useState, useEffect, useMemo } from 'react';
import { Check, X, Loader2, AlertCircle, Filter, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { NEWS_IMPACTS, NewsImpact } from '@/types/trade';

// Popular currencies to show first
const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD'];

// Custom news/globe icon - matches navigation
const NewsIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

interface NewsEvent {
  id: string;
  title: string;
  currency: string;
  time: string;
  impact: 'high' | 'medium' | 'low';
}

interface SelectedNewsEvent {
  title: string;
  impact: string;
  currency?: string;
  time?: string;
}

interface NewsEventSelectorProps {
  date: string | null;
  hasNews: boolean;
  selectedEvents?: SelectedNewsEvent[];
  // Legacy single-select props for backward compatibility
  selectedNewsTitle?: string;
  newsImpact?: string;
  onHasNewsChange: (hasNews: boolean) => void;
  onNewsSelect: (title: string, impact: string) => void;
  onMultiNewsSelect?: (events: SelectedNewsEvent[]) => void;
}

export function NewsEventSelector({
  date,
  hasNews,
  selectedEvents = [],
  selectedNewsTitle,
  newsImpact,
  onHasNewsChange,
  onNewsSelect,
  onMultiNewsSelect,
}: NewsEventSelectorProps) {
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [impactFilter, setImpactFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');

  // Multi-select state - use selectedEvents prop or fall back to legacy single select
  const [localSelectedEvents, setLocalSelectedEvents] = useState<SelectedNewsEvent[]>(() => {
    if (selectedEvents.length > 0) return selectedEvents;
    if (selectedNewsTitle && newsImpact) return [{ title: selectedNewsTitle, impact: newsImpact }];
    return [];
  });

  // Sync with props
  useEffect(() => {
    if (selectedEvents.length > 0) {
      setLocalSelectedEvents(selectedEvents);
    } else if (selectedNewsTitle && newsImpact) {
      setLocalSelectedEvents([{ title: selectedNewsTitle, impact: newsImpact }]);
    } else if (!hasNews) {
      setLocalSelectedEvents([]);
    }
  }, [selectedEvents, selectedNewsTitle, newsImpact, hasNews]);

  // Fetch news events when date changes and has_news is true
  useEffect(() => {
    if (!hasNews || !date) {
      setNewsEvents([]);
      return;
    }

    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const selectedDate = new Date(date);
        
        const { data, error: fetchError } = await supabase.functions.invoke('economic-calendar', {
          body: {
            date: selectedDate.toISOString(),
            range: 'day',
          },
        });

        if (fetchError) throw fetchError;

        // The edge function returns { success, data: events[], lastUpdated }
        const events = data?.data || [];
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const dayEvents = events.filter((event: any) => event.date === dateStr);
        
        setNewsEvents(dayEvents.map((event: any) => ({
          id: event.id,
          title: event.title,
          currency: event.currency,
          time: event.time,
          impact: event.impact,
        })));
      } catch (err) {
        console.error('Failed to fetch news:', err);
        setError('Failed to load news events');
        setNewsEvents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [hasNews, date]);

  // Get unique currencies from events, sorted with popular ones first
  const availableCurrencies = useMemo(() => {
    const currencies = [...new Set(newsEvents.map(e => e.currency))];
    
    // Sort: popular currencies first, then alphabetically
    return currencies.sort((a, b) => {
      const aPopular = POPULAR_CURRENCIES.indexOf(a);
      const bPopular = POPULAR_CURRENCIES.indexOf(b);
      
      // Both are popular - sort by their order in POPULAR_CURRENCIES
      if (aPopular !== -1 && bPopular !== -1) {
        return aPopular - bPopular;
      }
      // Only a is popular
      if (aPopular !== -1) return -1;
      // Only b is popular
      if (bPopular !== -1) return 1;
      // Neither is popular - sort alphabetically
      return a.localeCompare(b);
    });
  }, [newsEvents]);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return newsEvents.filter(event => {
      const matchesImpact = impactFilter === 'all' || event.impact === impactFilter;
      const matchesCurrency = currencyFilter === 'all' || event.currency === currencyFilter;
      return matchesImpact && matchesCurrency;
    });
  }, [newsEvents, impactFilter, currencyFilter]);

  // Group filtered events by impact
  const groupedEvents = useMemo(() => {
    const high = filteredEvents.filter(e => e.impact === 'high');
    const medium = filteredEvents.filter(e => e.impact === 'medium');
    const low = filteredEvents.filter(e => e.impact === 'low');
    return { high, medium, low };
  }, [filteredEvents]);

  const handleNewsSelect = (eventTitle: string) => {
    const event = newsEvents.find(e => e.title === eventTitle);
    if (event) {
      const newEvent: SelectedNewsEvent = {
        title: event.title,
        impact: event.impact,
        currency: event.currency,
        time: event.time,
      };
      
      // Check if already selected
      const isAlreadySelected = localSelectedEvents.some(e => e.title === event.title);
      
      if (isAlreadySelected) {
        // Remove it
        const updated = localSelectedEvents.filter(e => e.title !== event.title);
        setLocalSelectedEvents(updated);
        if (onMultiNewsSelect) {
          onMultiNewsSelect(updated);
        }
        // For legacy support, call onNewsSelect with first remaining event or empty
        if (updated.length > 0) {
          onNewsSelect(updated[0].title, updated[0].impact);
        } else {
          onNewsSelect('', '');
        }
      } else {
        // Add it
        const updated = [...localSelectedEvents, newEvent];
        setLocalSelectedEvents(updated);
        if (onMultiNewsSelect) {
          onMultiNewsSelect(updated);
        }
        // For legacy support
        onNewsSelect(newEvent.title, newEvent.impact);
      }
    }
  };

  const removeSelectedEvent = (title: string) => {
    const updated = localSelectedEvents.filter(e => e.title !== title);
    setLocalSelectedEvents(updated);
    if (onMultiNewsSelect) {
      onMultiNewsSelect(updated);
    }
    if (updated.length > 0) {
      onNewsSelect(updated[0].title, updated[0].impact);
    } else {
      onNewsSelect('', '');
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-orange-500';
      case 'low': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactBgColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 border-red-500/30';
      case 'medium': return 'bg-orange-500/10 border-orange-500/30';
      case 'low': return 'bg-yellow-500/10 border-yellow-500/30';
      default: return 'bg-muted/50 border-border';
    }
  };

  // Reset filters when date changes
  useEffect(() => {
    setImpactFilter('all');
    setCurrencyFilter('all');
  }, [date]);

  return (
    <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center gap-2">
        <NewsIcon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium text-foreground">Economic News</Label>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <button 
          type="button" 
          onClick={() => onHasNewsChange(true)} 
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2", 
            hasNews 
              ? "bg-pnl-positive/15 text-pnl-positive border-pnl-positive/30" 
              : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          )}
        >
          <Check className="h-4 w-4" />
          Yes
        </button>
        <button 
          type="button" 
          onClick={() => {
            onHasNewsChange(false);
            setLocalSelectedEvents([]);
            onNewsSelect('', '');
            if (onMultiNewsSelect) onMultiNewsSelect([]);
          }} 
          className={cn(
            "h-10 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2", 
            !hasNews 
              ? "bg-primary/10 text-primary border-primary/20" 
              : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          )}
        >
          <X className="h-4 w-4" />
          No
        </button>
      </div>

      {hasNews && (
        <div className="space-y-3 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          {!date ? (
            <p className="text-sm text-muted-foreground">Please select a date first</p>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading news events...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ) : newsEvents.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">No news events found for this date</p>
              {/* Fallback to manual impact selection */}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Impact Level</Label>
                <Select 
                  value={newsImpact || ''} 
                  onValueChange={(value) => onNewsSelect('', value)}
                >
                  <SelectTrigger className="h-9 bg-background/50 border-border/50 text-sm">
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {NEWS_IMPACTS.map(impact => (
                      <SelectItem key={impact.value} value={impact.value}>
                        <span className={cn("font-medium", impact.color)}>{impact.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected Events Display */}
              {localSelectedEvents.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Selected Events ({localSelectedEvents.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {localSelectedEvents.map((event, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs",
                          getImpactBgColor(event.impact)
                        )}
                      >
                        <span className={cn("font-medium", getImpactColor(event.impact))}>
                          {event.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelectedEvent(event.title)}
                          className="p-0.5 hover:bg-foreground/10 rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Filter className="h-3 w-3" />
                <span>Filter by:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={impactFilter} onValueChange={setImpactFilter}>
                  <SelectTrigger className="h-8 bg-background/50 border-border/50 text-xs">
                    <SelectValue placeholder="Impact" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Impacts</SelectItem>
                    <SelectItem value="high">
                      <span className="text-red-500 font-medium">High</span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="text-orange-500 font-medium">Medium</span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="text-yellow-500 font-medium">Low</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
                  <SelectTrigger className="h-8 bg-background/50 border-border/50 text-xs">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-[200px]">
                    <SelectItem value="all">All Currencies</SelectItem>
                    {availableCurrencies.map((currency, idx) => (
                      <SelectItem key={currency} value={currency}>
                        <span className={idx < POPULAR_CURRENCIES.filter(c => availableCurrencies.includes(c)).length ? 'font-medium' : ''}>
                          {currency}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* News Event Selector */}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">
                  Add News Event
                  {filteredEvents.length !== newsEvents.length && (
                    <span className="text-xs ml-1">({filteredEvents.length} of {newsEvents.length})</span>
                  )}
                </Label>
                <Select 
                  value=""
                  onValueChange={handleNewsSelect}
                >
                  <SelectTrigger className="h-9 bg-background/50 border-border/50 text-sm">
                    <SelectValue placeholder="Select news event to add" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-[300px]">
                    {filteredEvents.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                        No events match filters
                      </div>
                    ) : (
                      <>
                        {groupedEvents.high.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-red-500 uppercase">High Impact</div>
                            {groupedEvents.high.map(event => {
                              const isSelected = localSelectedEvents.some(e => e.title === event.title);
                              return (
                                <SelectItem key={event.id} value={event.title} className={isSelected ? 'bg-primary/10' : ''}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                                    <span className="text-red-500 text-xs">{event.time}</span>
                                    <span className="font-medium">{event.title}</span>
                                    <span className="text-muted-foreground text-xs">({event.currency})</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </>
                        )}
                        {groupedEvents.medium.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-orange-500 uppercase mt-1">Medium Impact</div>
                            {groupedEvents.medium.map(event => {
                              const isSelected = localSelectedEvents.some(e => e.title === event.title);
                              return (
                                <SelectItem key={event.id} value={event.title} className={isSelected ? 'bg-primary/10' : ''}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                                    <span className="text-orange-500 text-xs">{event.time}</span>
                                    <span className="font-medium">{event.title}</span>
                                    <span className="text-muted-foreground text-xs">({event.currency})</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </>
                        )}
                        {groupedEvents.low.length > 0 && (
                          <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-yellow-500 uppercase mt-1">Low Impact</div>
                            {groupedEvents.low.map(event => {
                              const isSelected = localSelectedEvents.some(e => e.title === event.title);
                              return (
                                <SelectItem key={event.id} value={event.title} className={isSelected ? 'bg-primary/10' : ''}>
                                  <div className="flex items-center gap-2">
                                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                                    <span className="text-yellow-500 text-xs">{event.time}</span>
                                    <span className="font-medium">{event.title}</span>
                                    <span className="text-muted-foreground text-xs">({event.currency})</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
