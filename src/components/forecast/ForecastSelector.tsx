import { useState, useEffect } from 'react';
import { Link2, Link2Off, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface Forecast {
  id: string;
  date: string;
  symbol: string;
  direction: 'bullish' | 'bearish';
  forecast_type: string;
}

interface ForecastSelectorProps {
  value?: string | null;
  onChange: (forecastId: string | null) => void;
  symbol?: string;
}

export function ForecastSelector({ value, onChange, symbol }: ForecastSelectorProps) {
  const [open, setOpen] = useState(false);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    fetchForecasts();
  }, []);

  useEffect(() => {
    if (value && forecasts.length > 0) {
      const found = forecasts.find(f => f.id === value);
      setSelectedForecast(found || null);
    } else {
      setSelectedForecast(null);
    }
  }, [value, forecasts]);

  const fetchForecasts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('morning_forecasts')
        .select('id, date, symbol, direction, forecast_type')
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setForecasts((data || []).map(item => ({
        id: item.id,
        date: item.date,
        symbol: item.symbol || 'Unknown',
        direction: (item.direction as 'bullish' | 'bearish') || 'bullish',
        forecast_type: item.forecast_type || 'pre_market',
      })));
    } catch (error) {
      console.error('Error fetching forecasts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (forecast: Forecast | null) => {
    setSelectedForecast(forecast);
    onChange(forecast?.id || null);
    setOpen(false);
  };

  // Filter by symbol if provided
  const filteredForecasts = symbol 
    ? forecasts.filter(f => f.symbol.toLowerCase() === symbol.toLowerCase())
    : forecasts;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'justify-between h-11 border-border w-full',
            selectedForecast 
              ? 'bg-primary/10 border-primary/30 hover:bg-primary/15' 
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <div className="flex items-center gap-2">
            {selectedForecast ? (
              <>
                <Link2 className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{selectedForecast.symbol}</span>
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded uppercase font-medium',
                  selectedForecast.direction === 'bullish'
                    ? 'bg-pnl-positive/20 text-pnl-positive'
                    : 'bg-pnl-negative/20 text-pnl-negative'
                )}>
                  {selectedForecast.direction}
                </span>
              </>
            ) : (
              <>
                <Link2Off className="h-4 w-4" />
                <span>Link to Forecast</span>
              </>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-border">
          <p className="text-sm font-medium">Link to Forecast</p>
          <p className="text-xs text-muted-foreground">
            Connect this trade to an existing forecast
          </p>
        </div>
        
        {isLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredForecasts.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No forecasts found
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto p-1">
            {selectedForecast && (
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md hover:bg-muted/50 text-muted-foreground"
                onClick={() => handleSelect(null)}
              >
                <Link2Off className="h-4 w-4" />
                Remove link
              </button>
            )}
            {filteredForecasts.map((forecast) => (
              <button
                key={forecast.id}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-md hover:bg-muted/50',
                  selectedForecast?.id === forecast.id && 'bg-primary/10'
                )}
                onClick={() => handleSelect(forecast)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{forecast.symbol}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded uppercase',
                    forecast.direction === 'bullish'
                      ? 'bg-pnl-positive/20 text-pnl-positive'
                      : 'bg-pnl-negative/20 text-pnl-negative'
                  )}>
                    {forecast.direction}
                  </span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    forecast.forecast_type === 'pre_market'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  )}>
                    {forecast.forecast_type === 'pre_market' ? 'Pre' : 'Post'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(forecast.date), 'MMM d')}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
