import { useState, useEffect } from 'react';
import { X, Plus, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/trade/ImageUpload';
import { SymbolCombobox } from '@/components/trade/SymbolCombobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface ChartAnalysis {
  id: string;
  timeframe: string;
  images: string[];
  notes: string;
}

export interface ForecastFormData {
  id?: string;
  symbol: string;
  direction: 'bullish' | 'bearish';
  charts: ChartAnalysis[];
  postMarketCharts: ChartAnalysis[];
  status: 'pending' | 'completed';
  outcome?: 'win' | 'loss' | null;
  date?: Date;
  time?: string;
  postMarketNotes?: string;
}

interface ForecastDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forecast?: ForecastFormData | null;
  onSave: (data: ForecastFormData) => void;
  isSaving?: boolean;
}

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
];

export function ForecastDialog({ open, onOpenChange, forecast, onSave, isSaving }: ForecastDialogProps) {
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<'bullish' | 'bearish'>('bullish');
  const [charts, setCharts] = useState<ChartAnalysis[]>([]);
  const [postMarketCharts, setPostMarketCharts] = useState<ChartAnalysis[]>([]);
  const [forecastDate, setForecastDate] = useState<Date>(new Date());
  const [forecastTime, setForecastTime] = useState('09:00');
  const [postMarketNotes, setPostMarketNotes] = useState('');

  useEffect(() => {
    if (forecast) {
      setSymbol(forecast.symbol || '');
      setDirection(forecast.direction || 'bullish');
      setCharts(forecast.charts?.length > 0 ? forecast.charts : [createEmptyChart()]);
      setPostMarketCharts(forecast.postMarketCharts?.length > 0 ? forecast.postMarketCharts : []);
      setForecastDate(forecast.date || new Date());
      setForecastTime(forecast.time || '09:00');
      setPostMarketNotes(forecast.postMarketNotes || '');
    } else {
      setSymbol('');
      setDirection('bullish');
      setCharts([createEmptyChart()]);
      setPostMarketCharts([]);
      setForecastDate(new Date());
      setForecastTime('09:00');
      setPostMarketNotes('');
    }
  }, [forecast, open]);

  const createEmptyChart = (): ChartAnalysis => ({
    id: crypto.randomUUID(),
    timeframe: '4h',
    images: [],
    notes: ''
  });

  const addChart = (isPostMarket = false) => {
    if (isPostMarket) {
      setPostMarketCharts([...postMarketCharts, createEmptyChart()]);
    } else {
      setCharts([...charts, createEmptyChart()]);
    }
  };

  const updateChart = (id: string, field: keyof ChartAnalysis, value: any, isPostMarket = false) => {
    if (isPostMarket) {
      setPostMarketCharts(postMarketCharts.map(chart => 
        chart.id === id ? { ...chart, [field]: value } : chart
      ));
    } else {
      setCharts(charts.map(chart => 
        chart.id === id ? { ...chart, [field]: value } : chart
      ));
    }
  };

  const removeChart = (id: string, isPostMarket = false) => {
    if (isPostMarket) {
      setPostMarketCharts(postMarketCharts.filter(chart => chart.id !== id));
    } else if (charts.length > 1) {
      setCharts(charts.filter(chart => chart.id !== id));
    }
  };

  const handleSubmit = () => {
    if (!symbol.trim()) return;
    
    onSave({
      id: forecast?.id,
      symbol: symbol.trim(),
      direction,
      charts,
      postMarketCharts,
      status: forecast?.status || 'pending',
      outcome: forecast?.outcome,
      date: forecastDate,
      time: forecastTime,
      postMarketNotes
    });
  };

  const isEditing = !!forecast?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Forecast' : 'New Forecast'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Update your chart analysis' : 'Create your chart analysis'}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-background border-border",
                      !forecastDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {forecastDate ? format(forecastDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={forecastDate}
                    onSelect={(date) => date && setForecastDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input
                type="time"
                value={forecastTime}
                onChange={(e) => setForecastTime(e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Trading Pair & Direction */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Trading Pair *</Label>
              <SymbolCombobox value={symbol} onChange={setSymbol} />
            </div>
            <div className="space-y-2">
              <Label>Expected Direction *</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as 'bullish' | 'bearish')}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bullish">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-pnl-positive" />
                      Bullish
                    </span>
                  </SelectItem>
                  <SelectItem value="bearish">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-pnl-negative" />
                      Bearish
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pre-Market Analysis Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <Label className="text-base font-semibold">Pre-Market Analysis</Label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addChart(false)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Chart
              </Button>
            </div>

            {charts.map((chart, index) => (
              <div key={chart.id} className="space-y-4 p-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5">
                <div className="flex items-center gap-2">
                  <Select 
                    value={chart.timeframe} 
                    onValueChange={(v) => updateChart(chart.id, 'timeframe', v, false)}
                  >
                    <SelectTrigger className="w-36 bg-background border-border">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEFRAMES.map(tf => (
                        <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {charts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeChart(chart.id, false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <ImageUpload
                  images={chart.images}
                  onChange={(images) => updateChart(chart.id, 'images', images, false)}
                  maxImages={3}
                />

                <Textarea
                  placeholder="Your pre-market analysis notes..."
                  value={chart.notes}
                  onChange={(e) => updateChart(chart.id, 'notes', e.target.value, false)}
                  className="min-h-[80px] bg-background border-border"
                />
              </div>
            ))}
          </div>

          {/* Post-Market Analysis Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <Label className="text-base font-semibold">Post-Market Review</Label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addChart(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Chart
              </Button>
            </div>

            {postMarketCharts.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 text-center">
                <p className="text-sm text-muted-foreground">No post-market charts added yet. Click "Add Chart" to add your review.</p>
              </div>
            ) : (
              postMarketCharts.map((chart, index) => (
                <div key={chart.id} className="space-y-4 p-4 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5">
                  <div className="flex items-center gap-2">
                    <Select 
                      value={chart.timeframe} 
                      onValueChange={(v) => updateChart(chart.id, 'timeframe', v, true)}
                    >
                      <SelectTrigger className="w-36 bg-background border-border">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEFRAMES.map(tf => (
                          <SelectItem key={tf.value} value={tf.value}>{tf.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeChart(chart.id, true)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ImageUpload
                    images={chart.images}
                    onChange={(images) => updateChart(chart.id, 'images', images, true)}
                    maxImages={3}
                  />

                  <Textarea
                    placeholder="Your post-market review notes..."
                    value={chart.notes}
                    onChange={(e) => updateChart(chart.id, 'notes', e.target.value, true)}
                    className="min-h-[80px] bg-background border-border"
                  />
                </div>
              ))
            )}

            <Textarea
              placeholder="Overall post-market notes and lessons learned..."
              value={postMarketNotes}
              onChange={(e) => setPostMarketNotes(e.target.value)}
              className="min-h-[80px] bg-background border-border"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4">
            <Button onClick={handleSubmit} disabled={isSaving || !symbol.trim()}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Forecast' : 'Create Forecast'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
