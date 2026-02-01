import { useParams, useNavigate } from 'react-router-dom';
import { useTrades } from '@/hooks/useTrades';
import { useSettings } from '@/hooks/useSettings';
import { usePreferences } from '@/hooks/usePreferences';
import { TradeCard } from '@/components/trade/TradeCard';
import { PnlDisplay } from '@/components/ui/PnlDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DayView() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const { getTradesByDate, getDailyPnl, isLoading } = useTrades();
  const { settings } = useSettings();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  
  if (!date) {
    navigate('/calendar');
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading trades...</p>
      </div>
    );
  }

  const trades = getTradesByDate(date);
  // Calculate PnL only from real trades (exclude paper trades and no trade taken)
  const realTrades = trades.filter(t => !t.isPaperTrade && !t.noTradeTaken);
  const dailyPnl = realTrades.reduce((sum, t) => sum + t.pnlAmount, 0);
  const dailyGoal = settings.goals.daily;
  const goalProgress = (dailyPnl / dailyGoal) * 100;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur-sm">
        <div className="px-4 py-4 md:px-6 lg:px-8">
          <div className="mb-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/calendar')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">
                {format(parseISO(date), 'EEEE, MMMM d')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {trades.length} {trades.length === 1 ? 'trade' : 'trades'}
              </p>
            </div>
          </div>
          
          {/* Daily Summary */}
          <div className={cn(
            "rounded-2xl border p-4 relative overflow-hidden",
            isGlassEnabled
              ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
              : "border-border/50 bg-card"
          )}>
            {isGlassEnabled && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dayview-summary-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.04] dark:fill-foreground/[0.03]" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dayview-summary-dots)" />
              </svg>
            )}
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs text-muted-foreground">Day's P&L</p>
                <PnlDisplay value={dailyPnl} size="lg" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Goal: ${dailyGoal}</p>
                <p className="font-display font-bold text-sm tabular-nums">
                  {goalProgress >= 100 ? '✓ Achieved' : `${goalProgress.toFixed(0)}%`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 md:px-6 lg:px-8">
        {trades.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center py-12 text-center rounded-2xl border relative overflow-hidden",
            isGlassEnabled
              ? "border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl"
              : "border-border/50 bg-card"
          )}>
            {isGlassEnabled && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="dayview-empty-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                    <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.04] dark:fill-foreground/[0.03]" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dayview-empty-dots)" />
              </svg>
            )}
            <p className="mb-4 text-muted-foreground relative">No trades on this day</p>
            <Button onClick={() => navigate(`/add?date=${date}`)} className="relative">
              <Plus className="mr-2 h-4 w-4" />
              Log a Trade
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} />
            ))}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => navigate(`/add?date=${date}`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Trade
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
