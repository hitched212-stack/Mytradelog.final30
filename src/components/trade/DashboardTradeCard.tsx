import { memo } from 'react';
import { Trade } from '@/types/trade';
import { Calendar, Link2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { SymbolIcon } from '@/components/ui/SymbolIcon';
import { Badge } from '@/components/ui/badge';
import { usePreferences } from '@/hooks/usePreferences';

interface DashboardTradeCardProps {
  trade: Trade;
  currencySymbol: string;
  onClick: () => void;
}

/**
 * Memoized trade card component for dashboard.
 * Uses stable keys and avoids unnecessary re-renders during transitions.
 */
export const DashboardTradeCard = memo(function DashboardTradeCard({
  trade,
  currencySymbol,
  onClick
}: DashboardTradeCardProps) {
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;

  const formatPnl = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${currencySymbol}${Math.abs(value).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatPnlPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const isPaper = trade.isPaperTrade;
  const isNoTrade = trade.noTradeTaken;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 cursor-pointer relative overflow-hidden group",
        "border-border/50 shadow-sm",
        "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
        "transition-all duration-200",
        isGlassEnabled
          ? "bg-card/95 dark:bg-card/80 backdrop-blur-xl"
          : "bg-card hover:bg-muted/50"
      )}
    >
      {/* Dot pattern - only show when glass is enabled */}
      {isGlassEnabled && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`dashboard-card-${trade.id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dashboard-card-${trade.id})`} />
        </svg>
      )}
      
      <div className="flex items-start justify-between mb-3 relative">
        <div className="flex items-center gap-3">
          {/* Symbol Icon - use key to prevent remounting */}
          <div key={`symbol-${trade.id}-${trade.symbol}`} className="flex-shrink-0">
            <SymbolIcon symbol={trade.symbol} size="md" />
          </div>
          
          {/* Trade Info */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground">{trade.symbol}</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border',
                'border-border bg-muted/50 text-muted-foreground'
              )}>
                {trade.direction}
              </span>
              {isPaper && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
                  Paper
                </span>
              )}
              {isNoTrade && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
                  No Trade
                </span>
              )}
              {trade.forecastId && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-blue-500/30 bg-blue-500/10 text-blue-500 dark:text-blue-400">
                  <Link2 className="h-2.5 w-2.5" />
                  Linked
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">
              {trade.category || 'Stocks'} • {trade.lotSize} units
              {trade.stopLossPips && ` • SL: ${trade.stopLossPips} pips`}
            </p>
          </div>
        </div>

        {/* P&L - Hidden for paper trades and no trade taken */}
        {!isPaper && !isNoTrade && (
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <ArrowUpRight className={cn(
                "h-4 w-4",
                trade.pnlAmount >= 0 ? "text-pnl-positive" : "text-pnl-negative"
              )} />
              <span className={cn(
                'font-semibold text-lg font-display tabular-nums',
                trade.pnlAmount >= 0 ? 'text-pnl-positive' : 'text-pnl-negative'
              )}>
                {formatPnl(trade.pnlAmount)}
              </span>
            </div>
            <p className={cn(
              "text-sm font-display tabular-nums",
              trade.pnlAmount >= 0 ? "text-pnl-positive" : "text-pnl-negative"
            )}>
              {formatPnlPercentage(trade.pnlPercentage)}
            </p>
          </div>
        )}
        {(isPaper || isNoTrade) && (
          <span className="px-3 py-1 rounded-full text-xs font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
            {isPaper ? 'Paper' : 'No Trade'}
          </span>
        )}
      </div>

      {/* Date */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground relative">
        <Calendar className="h-4 w-4" />
        {format(parseISO(trade.date), 'dd/MM/yyyy')}
      </div>
    </div>
  );
});
