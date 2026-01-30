import { TrendingUp, TrendingDown, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { getTimeframeLabel } from '@/lib/timeframes';

interface ChartAnalysis {
  id: string;
  timeframe: string;
  images: string[];
  notes: string;
}

interface ForecastViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  forecast: {
    id: string;
    symbol: string;
    direction: 'bullish' | 'bearish';
    charts: ChartAnalysis[];
    status: 'pending' | 'completed';
    outcome?: 'win' | 'loss' | null;
    date: string;
    forecast_type?: 'pre_market' | 'post_market';
  } | null;
}

export function ForecastViewDialog({ open, onOpenChange, forecast }: ForecastViewDialogProps) {
  if (!forecast) return null;

  const isPending = forecast.status === 'pending';
  const isWin = forecast.outcome === 'win';
  const isPreMarket = forecast.forecast_type === 'pre_market';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg',
              forecast.direction === 'bullish' ? 'bg-pnl-positive/20' : 'bg-pnl-negative/20'
            )}>
              {forecast.direction === 'bullish' ? (
                <TrendingUp className="h-5 w-5 text-pnl-positive" />
              ) : (
                <TrendingDown className="h-5 w-5 text-pnl-negative" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xl">{forecast.symbol}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-semibold uppercase',
                  forecast.direction === 'bullish' ? 'bg-pnl-positive/20 text-pnl-positive' : 'bg-pnl-negative/20 text-pnl-negative'
                )}>
                  {forecast.direction}
                </span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-semibold',
                  isPreMarket ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                )}>
                  {isPreMarket ? 'Pre-Market' : 'Post-Market'}
                </span>
                {!isPending && (
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-semibold uppercase',
                    isWin ? 'bg-pnl-positive/20 text-pnl-positive' : 'bg-pnl-negative/20 text-pnl-negative'
                  )}>
                    {forecast.outcome}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 font-normal">
                <Clock className="h-3 w-3" />
                {format(new Date(forecast.date), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {forecast.charts && forecast.charts.length > 0 && (
            <div className="space-y-6">
              {forecast.charts.map((chart) => (
                <div key={chart.id} className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium px-3 py-1 rounded bg-muted text-foreground">
                      {getTimeframeLabel(chart.timeframe)}
                    </span>
                  </div>
                  
                  {chart.images && chart.images.length > 0 && (
                    <div className="space-y-3">
                      {chart.images.map((img, idx) => (
                        <div key={idx} className="rounded-lg border border-border overflow-hidden bg-background">
                          <img
                            src={img}
                            alt={`Chart ${idx + 1}`}
                            className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(img, '_blank')}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {chart.notes && (
                    <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg">
                      {chart.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}