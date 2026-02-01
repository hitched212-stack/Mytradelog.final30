import { useState } from 'react';
import { Trade } from '@/types/trade';
import { PnlDisplay } from '@/components/ui/PnlDisplay';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Copy, Trash2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '@/store/tradeStore';
import { usePreferences } from '@/hooks/usePreferences';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { VirtualCandlestickChart } from './VirtualCandlestickChart';
import { ImageGallery } from './ImageGallery';
import { SymbolIcon } from '@/components/ui/SymbolIcon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


interface TradeCardProps {
  trade: Trade;
}

export function TradeCard({
  trade
}: TradeCardProps) {
  const navigate = useNavigate();
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const {
    deleteTrade,
    duplicateTrade
  } = useTradeStore();
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  const handleEdit = () => {
    navigate(`/edit/${trade.id}`);
  };
  
  const handleDuplicate = () => {
    duplicateTrade(trade.id);
  };
  
  const handleDelete = () => {
    deleteTrade(trade.id);
    setDeleteConfirmOpen(false);
  };
  
  const isLong = trade.direction === 'long';
  const isPaper = trade.isPaperTrade;
  const isNoTrade = trade.noTradeTaken;
  
  return (
    <div className={cn(
      "rounded-2xl border relative overflow-hidden group",
      isGlassEnabled
        ? "bg-card/95 dark:bg-card/80 backdrop-blur-xl border-border/50"
        : "bg-card border-border/50 shadow-sm"
    )}>
      {/* Dot pattern - only show when glass is enabled */}
      {isGlassEnabled && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`trade-card-${trade.id}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#trade-card-${trade.id})`} />
        </svg>
      )}
      {/* Compact Header */}
      <div 
        className="flex items-center justify-between p-3 md:p-4 cursor-pointer hover:bg-muted/50 transition-all duration-300 relative" 
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          {/* Symbol Icon */}
          <SymbolIcon symbol={trade.symbol} size="md" />
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base md:text-lg font-semibold text-foreground">
                {trade.symbol}
              </span>
              <span className={cn(
                'rounded px-1.5 py-0.5 text-[10px] md:text-xs font-medium uppercase',
                isLong ? 'bg-pnl-positive/20 text-pnl-positive' : 'bg-pnl-negative/20 text-pnl-negative'
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
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs md:text-sm text-muted-foreground">
              <span>{format(new Date(trade.date), 'MMM d, yyyy')}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {trade.entryTime}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          {!isPaper && !isNoTrade && <PnlDisplay value={trade.pnlAmount} size="lg" />}
          {(isPaper || isNoTrade) && (
            <span className="px-3 py-1 rounded-full text-xs font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
              {isPaper ? 'Paper' : 'No Trade'}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-border px-3 md:px-4 pb-3 md:pb-4 relative">
          {/* Chart Images */}
          {trade.images && trade.images.length > 0 && (
            <div className="py-3 border-b border-border">
              <span className="text-xs text-muted-foreground block mb-2">Chart Screenshots</span>
              <ImageGallery images={trade.images} thumbnailSize="md" />
            </div>
          )}
          
          {/* Trade details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm py-3 md:py-4 md:mb-0">
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Entry</span>
              <div className="text-foreground tabular-nums text-sm font-display font-bold">{trade.entryPrice || 0}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Stop Loss</span>
              <div className="text-foreground tabular-nums text-sm font-display font-bold">{trade.stopLoss || 0}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Take Profit</span>
              <div className="text-foreground tabular-nums text-sm font-display font-bold">{trade.takeProfit || 0}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Lot Size</span>
              <div className="text-foreground tabular-nums text-sm font-display font-bold">{trade.lotSize || 0}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">R:R</span>
              <div className="text-foreground text-sm">{trade.riskRewardRatio || '0'}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Grade</span>
              <div className="text-foreground text-sm">{trade.performanceGrade}/5</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Entry Time</span>
              <div className="text-foreground text-sm">{trade.entryTime}</div>
            </div>
            <div>
              <span className="text-[10px] md:text-xs text-muted-foreground">Holding</span>
              <div className="text-foreground text-sm">{trade.holdingTime || '0'}</div>
            </div>
          </div>

          {/* Strategy */}
          {trade.strategy && (
            <div className="mb-3 md:mb-4">
              <span className="text-[10px] md:text-xs text-muted-foreground">Strategy</span>
              <div className="text-sm text-foreground break-words">{trade.strategy}</div>
            </div>
          )}

          {/* Notes */}
          {(trade.preMarketPlan || trade.postMarketReview || trade.emotionalJournalAfter) && (
            <div className="space-y-2 mb-3 md:mb-4">
              {trade.preMarketPlan && (
                <div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">Trade Notes</span>
                  <div className="text-sm text-foreground break-words">{trade.preMarketPlan}</div>
                </div>
              )}
              {trade.postMarketReview && (
                <div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">Mistakes</span>
                  <div className="text-sm text-foreground break-words">{trade.postMarketReview}</div>
                </div>
              )}
              {trade.emotionalJournalAfter && (
                <div>
                  <span className="text-[10px] md:text-xs text-muted-foreground">Lessons Learned</span>
                  <div className="text-sm text-foreground break-words">{trade.emotionalJournalAfter}</div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 md:gap-2 border-t border-border pt-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={e => {
                e.stopPropagation();
                handleEdit();
              }} 
              className="flex-1 text-xs md:text-sm text-muted-foreground hover:text-foreground h-8 md:h-9"
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={e => {
                e.stopPropagation();
                handleDuplicate();
              }} 
              className="flex-1 text-xs md:text-sm text-muted-foreground hover:text-foreground h-8 md:h-9"
            >
              <Copy className="mr-1 h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={e => {
                e.stopPropagation();
                setDeleteConfirmOpen(true);
              }} 
              className="flex-1 text-xs md:text-sm text-muted-foreground hover:text-destructive h-8 md:h-9"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Delete Trade Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trade</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trade? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}