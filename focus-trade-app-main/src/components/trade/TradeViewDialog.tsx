import { useState } from 'react';
import { Trade, getCurrencySymbol, NEWS_IMPACTS } from '@/types/trade';
import { usePreferences } from '@/hooks/usePreferences';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar, Link2, Pencil, X, Meh, Frown, Smile } from 'lucide-react';
import { getTimeframeLabel } from '@/lib/timeframes';
import { SymbolIcon } from '@/components/ui/SymbolIcon';

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

// Custom trading rules icon - minimal checklist matching nav
const TradingRulesIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="10" y1="6" x2="21" y2="6" />
    <line x1="10" y1="12" x2="21" y2="12" />
    <line x1="10" y1="18" x2="21" y2="18" />
    <polyline points="3 6 4 7 6 5" />
    <polyline points="3 12 4 13 6 11" />
    <polyline points="3 18 4 19 6 17" />
  </svg>
);
type ViewTab = 'general' | 'charts' | 'pre-market' | 'post-market' | 'emotions';
interface Forecast {
  id: string;
  symbol: string;
  direction: 'bullish' | 'bearish';
  charts: any[];
  status: 'pending' | 'completed';
  outcome: 'win' | 'loss' | null;
  date: string;
  forecast_type: 'pre_market' | 'post_market';
}
const EMOTION_LABELS = [{
  value: 1,
  label: 'Disappointed',
  icon: Frown,
  color: 'text-red-500'
}, {
  value: 2,
  label: 'Indifferent',
  icon: Meh,
  color: 'text-yellow-500'
}, {
  value: 3,
  label: 'Proud',
  icon: Smile,
  color: 'text-emerald-500'
}];
interface TradeViewDialogContentProps {
  trade: Trade;
  forecasts: Record<string, Forecast>;
  currencySymbol: string;
  formatPnl: (amount: number) => string;
  onClose: () => void;
  onEdit: (tab?: ViewTab) => void;
  onViewForecast: () => void;
  onImageClick: (images: string[], index: number) => void;
}
export function TradeViewDialogContent({
  trade,
  forecasts,
  currencySymbol,
  formatPnl,
  onClose,
  onEdit,
  onViewForecast,
  onImageClick
}: TradeViewDialogContentProps) {
  const { preferences } = usePreferences();
  const isGlassEnabled = preferences.liquidGlassEnabled ?? false;
  const [activeTab, setActiveTab] = useState<ViewTab>('general');
  const tabs: {
    id: ViewTab;
    label: string;
    labelFull: string;
  }[] = [{
    id: 'general',
    label: 'Overview',
    labelFull: 'Overview'
  }, {
    id: 'charts',
    label: 'Chart',
    labelFull: 'Chart'
  }, {
    id: 'pre-market',
    label: 'Plan',
    labelFull: 'Plan'
  }, {
    id: 'post-market',
    label: 'Review',
    labelFull: 'Review'
  }, {
    id: 'emotions',
    label: 'Mindset',
    labelFull: 'Mindset'
  }];
  const currentEmotion = EMOTION_LABELS.find(e => e.value === trade.emotionalState) || EMOTION_LABELS[2];
  const EmotionIcon = currentEmotion.icon;
  return <div className="w-full max-w-6xl mx-auto h-full flex flex-col flex-1 min-h-0">
      <div className="rounded-none sm:rounded-xl border-0 sm:border border-border/50 bg-card/95 dark:bg-card/80 backdrop-blur-xl shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden relative">
        {/* Dot pattern - only show when enabled */}
        {isGlassEnabled && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tradeview-dots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1" className="fill-foreground/[0.08] dark:fill-foreground/[0.04]" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tradeview-dots)" />
          </svg>
        )}
        {/* Header - theme-aware with safe area padding */}
        <div className="px-4 md:px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-border/50 flex-shrink-0 bg-muted/30 dark:bg-white/[0.02] relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <SymbolIcon symbol={trade.symbol} size="md" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-semibold text-foreground">{trade.symbol}</span>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    trade.direction === 'long' 
                      ? 'border-pnl-positive/30 bg-pnl-positive/10 text-pnl-positive'
                      : 'border-pnl-negative/30 bg-pnl-negative/10 text-pnl-negative'
                  )}>
                    {trade.direction === 'long' ? 'Long' : 'Short'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(trade.date), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tab Navigation - Modern Segmented Control */}
          <div className="flex justify-center w-full">
            <div className="flex items-center gap-0.5 p-1 rounded-full bg-muted overflow-x-auto scrollbar-hide w-fit border border-border">
              {tabs.map(tab => <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={cn("px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0", activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-background/50")}>
                  <span className="sm:hidden">{tab.label}</span>
                  <span className="hidden sm:inline">{tab.labelFull}</span>
                </button>)}
            </div>
          </div>
        </div>

        {/* Scrollable Content - touch-friendly scrolling for mobile */}
        <div 
          className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 overscroll-y-contain touch-pan-y min-h-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-5 animate-in fade-in-0 duration-300 ease-out">
              {/* Result - Compact */}
              <div className={cn(
                'rounded-xl border p-4 flex items-center justify-between',
                trade.isPaperTrade || trade.noTradeTaken
                  ? 'border-muted-foreground/30 bg-muted/30'
                  : trade.pnlAmount >= 0 
                    ? 'border-pnl-positive/30 bg-pnl-positive/10 dark:bg-pnl-positive/5' 
                    : 'border-pnl-negative/30 bg-pnl-negative/10 dark:bg-pnl-negative/5'
              )}>
                <div>
                  <span className="text-sm text-muted-foreground">Result</span>
                  {trade.isPaperTrade || trade.noTradeTaken ? (
                    <div className="text-2xl font-bold text-muted-foreground">—</div>
                  ) : (
                    <div className={cn('text-2xl font-bold', trade.pnlAmount >= 0 ? 'text-pnl-positive' : 'text-pnl-negative')}>
                      {formatPnl(trade.pnlAmount)}
                      <span className="text-sm font-normal ml-2">
                        ({trade.pnlAmount >= 0 ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  )}
                </div>
                {trade.isPaperTrade ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
                    Paper
                  </span>
                ) : trade.noTradeTaken ? (
                  <span className="px-3 py-1 rounded-full text-sm font-medium border border-muted-foreground/30 bg-muted-foreground/10 text-muted-foreground whitespace-nowrap">
                    No Trade
                  </span>
                ) : (
                  <span className={cn('px-3 py-1 rounded text-sm font-semibold uppercase', trade.pnlAmount >= 0 ? 'bg-pnl-positive/20 text-pnl-positive' : 'bg-pnl-negative/20 text-pnl-negative')}>
                    {trade.pnlAmount >= 0 ? 'WIN' : 'LOSS'}
                  </span>
                )}
              </div>

              {/* Trade Details - Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Entry</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">{trade.entryPrice?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Stop Loss</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {trade.stopLoss ? trade.stopLoss.toLocaleString() : null}
                    {trade.stopLoss && trade.stopLossPips ? ' ' : null}
                    {trade.stopLossPips ? <span className={trade.stopLoss ? "text-muted-foreground" : ""}>({trade.stopLossPips} pips)</span> : null}
                    {!trade.stopLoss && !trade.stopLossPips ? '-' : null}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Take Profit</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">{trade.takeProfit?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Lot Size</span>
                  <span className="text-sm font-medium text-foreground tabular-nums">{trade.lotSize?.toString() || '0'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Entry Time</span>
                  <span className="text-sm font-medium text-foreground">{trade.entryTime || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="text-sm font-medium text-foreground">{trade.holdingTime || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Risk:Reward</span>
                  <span className="text-sm font-medium text-foreground">{trade.riskRewardRatio || '-'}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 dark:bg-muted/30 border border-border/30">
                  <span className="text-sm text-muted-foreground">Grade</span>
                  <span className={cn(
                    "text-sm font-medium px-2 py-0.5 rounded",
                    trade.performanceGrade === 1 && "bg-red-500/20 text-red-400",
                    trade.performanceGrade === 2 && "bg-amber-500/20 text-amber-400",
                    trade.performanceGrade === 3 && "bg-emerald-500/20 text-emerald-400"
                  )}>{trade.performanceGrade}/3</span>
                </div>
              </div>

              {/* Rules Compliance & Category */}
              <div className="space-y-3">
                {/* Category Row */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-medium text-foreground capitalize">{(trade as any).category || '-'}</span>
                </div>

                {/* Rules Section */}
                {(trade.followedRulesList && trade.followedRulesList.length > 0) || (trade.brokenRules && trade.brokenRules.length > 0) ? (
                  <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                    <div className="flex items-center gap-2">
                      <TradingRulesIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">Trading Rules</span>
                    </div>

                    {/* Followed Rules */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-pnl-positive uppercase tracking-wide">Rules Followed</span>
                      {trade.followedRulesList && trade.followedRulesList.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {trade.followedRulesList.map((rule, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 text-xs rounded-md bg-pnl-positive/10 text-pnl-positive border border-pnl-positive/20"
                            >
                              {rule}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">None</p>
                      )}
                    </div>

                    {/* Broken Rules */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-pnl-negative uppercase tracking-wide">Rules Broken</span>
                      {trade.brokenRules && trade.brokenRules.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {trade.brokenRules.map((rule, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 text-xs rounded-md bg-pnl-negative/10 text-pnl-negative border border-pnl-negative/20"
                            >
                              {rule}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">None</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-muted-foreground">Rules Compliance</span>
                    <span className="text-sm text-muted-foreground">No rules recorded</span>
                  </div>
                )}
              </div>

              {/* Strategy */}
              {trade.strategy && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Strategy</span>
                  <span className="text-sm font-medium text-foreground truncate ml-2">{trade.strategy}</span>
                </div>
              )}

              {/* News Section */}
              <div className="space-y-3 p-4 rounded-xl border border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <NewsIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Economic News</span>
                </div>
                
                {trade.hasNews ? (
                  <div className="space-y-2 pt-1">
                    {/* Display new newsEvents array if available */}
                    {trade.newsEvents && trade.newsEvents.length > 0 ? (
                      trade.newsEvents.map((event, index) => (
                        <div key={event.id || index} className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-2">
                          {trade.newsEvents && trade.newsEvents.length > 1 && (
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Event {index + 1}</span>
                          )}
                          {event.type && (
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</span>
                              <p className="text-sm font-medium text-foreground break-words">{event.type}</p>
                            </div>
                          )}
                          <div className="flex flex-wrap gap-4">
                            {event.impact && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Impact</span>
                                <p className={cn(
                                  "text-sm font-medium",
                                  NEWS_IMPACTS.find(i => i.value === event.impact)?.color || 'text-foreground'
                                )}>
                                  {NEWS_IMPACTS.find(i => i.value === event.impact)?.label || event.impact}
                                </p>
                              </div>
                            )}
                            {event.currency && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Currency</span>
                                <p className="text-sm font-medium text-foreground">{event.currency}</p>
                              </div>
                            )}
                            {event.time && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</span>
                                <p className="text-sm font-medium text-foreground tabular-nums">{event.time}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      /* Fallback to legacy single news fields */
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30 space-y-2">
                        {trade.newsType && (
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</span>
                            <p className="text-sm font-medium text-foreground break-words">{trade.newsType}</p>
                          </div>
                        )}
                        <div className="flex gap-4">
                          {trade.newsImpact && (
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Impact</span>
                              <p className={cn(
                                "text-sm font-medium",
                                NEWS_IMPACTS.find(i => i.value === trade.newsImpact)?.color || 'text-foreground'
                              )}>
                                {NEWS_IMPACTS.find(i => i.value === trade.newsImpact)?.label || trade.newsImpact}
                              </p>
                            </div>
                          )}
                          {trade.newsTime && (
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Time</span>
                              <p className="text-sm font-medium text-foreground tabular-nums">{trade.newsTime}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No news on this day</p>
                )}
              </div>

              {/* Notes */}
              {trade.notes && (
                <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-foreground">Notes</span>
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CHARTS TAB */}
          {activeTab === 'charts' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {(() => {
                // Parse chart analysis notes to extract before/after sections
                const parseChartSections = () => {
                  const beforeSections: { timeframe: string | null; notes: string }[] = [];
                  const afterSections: { timeframe: string | null; notes: string }[] = [];
                  
                  if (!trade.chartAnalysisNotes) {
                    return { before: beforeSections, after: afterSections };
                  }
                  
                  // Split sections by double newlines, then parse each
                  const sections = trade.chartAnalysisNotes.split(/\n\n+/);
                  
                  sections.forEach(section => {
                    const match = section.match(/^\[(Before|After)\s*-\s*([^\]]+)\]\n?([\s\S]*)/i);
                    if (match) {
                      const type = match[1].toLowerCase();
                      const timeframe = match[2]?.trim() || null;
                      const notes = match[3]?.trim() || '';
                      
                      if (type === 'before') {
                        beforeSections.push({ timeframe, notes });
                      } else if (type === 'after') {
                        afterSections.push({ timeframe, notes });
                      }
                    } else {
                      // Legacy format without Before/After prefix
                      const legacyMatch = section.match(/^\[([^\]]+)\]\n?([\s\S]*)/);
                      if (legacyMatch) {
                        beforeSections.push({ timeframe: legacyMatch[1], notes: legacyMatch[2]?.trim() || '' });
                      } else if (section.trim()) {
                        beforeSections.push({ timeframe: null, notes: section.trim() });
                      }
                    }
                  });
                  
                  return { before: beforeSections, after: afterSections };
                };
                
                const { before: beforeSections, after: afterSections } = parseChartSections();
                const images = trade.images || [];
                
                // Images are stored as: [...beforeImages, ...afterImages]
                // Use section counts to split, but ensure we show all images even without notes
                const beforeSectionCount = beforeSections.length;
                const afterSectionCount = afterSections.length;
                
                // If we have both sections, split by before count; otherwise show all in the section that exists
                let beforeImages: string[] = [];
                let afterImages: string[] = [];
                
                if (beforeSectionCount > 0 && afterSectionCount > 0) {
                  beforeImages = images.slice(0, beforeSectionCount);
                  afterImages = images.slice(beforeSectionCount);
                } else if (beforeSectionCount > 0) {
                  beforeImages = images;
                } else if (afterSectionCount > 0) {
                  afterImages = images;
                } else {
                  // No notes at all - split evenly or show all in before
                  beforeImages = images;
                }
                
                const hasBeforeContent = beforeImages.length > 0 || beforeSections.length > 0;
                const hasAfterContent = afterImages.length > 0 || afterSections.length > 0;
                const hasContent = hasBeforeContent || hasAfterContent;

                if (!hasContent) {
                  return <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No chart images or notes uploaded</p>
                  </div>;
                }
                
                return <div className="space-y-6">
                  {/* Chart Before Section */}
                  {hasBeforeContent && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-sm font-semibold text-muted-foreground px-2">Chart Before</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      
                      {(() => {
                        const cardCount = Math.max(beforeImages.length, beforeSections.length);
                        return Array.from({ length: cardCount || 1 }).map((_, idx) => {
                          const image = beforeImages[idx];
                          const section = beforeSections[idx];
                          if (!image && !section) return null;
                          
                        return <div key={idx} className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
                            {section?.timeframe && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 rounded bg-muted text-sm font-medium text-foreground">
                                  {section.timeframe}
                                </span>
                              </div>
                            )}
                            {image && (
                              <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                              <img 
                                  src={image} 
                                  alt={section?.timeframe || `Chart Before ${idx + 1}`} 
                                  className="w-full h-auto object-contain cursor-pointer hover:opacity-80 transition-opacity block"
                                  style={{ 
                                    imageRendering: 'auto',
                                    maxWidth: '100%',
                                    height: 'auto',
                                  }}
                                  loading="eager"
                                  decoding="sync"
                                  onClick={() => onImageClick(images, idx)} 
                                />
                              </div>
                            )}
                            {section?.notes && (
                              <div className="rounded-lg border border-border bg-muted/50 p-3 mt-3">
                                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{section.notes}</p>
                              </div>
                            )}
                          </div>;
                        });
                      })()}
                    </div>
                  )}

                  {/* Divider between sections - always visible when after content exists */}
                  {hasAfterContent && (
                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-border/70" />
                      </div>
                    </div>
                  )}

                  {/* Chart After Section */}
                  {hasAfterContent && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-sm font-semibold text-muted-foreground px-2">Chart After</span>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      
                      {(() => {
                        const cardCount = Math.max(afterImages.length, afterSections.length);
                        return Array.from({ length: cardCount || 1 }).map((_, idx) => {
                          const image = afterImages[idx];
                          const section = afterSections[idx];
                          if (!image && !section) return null;
                          
                        return <div key={idx} className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
                            {section?.timeframe && (
                              <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 rounded bg-muted text-sm font-medium text-foreground">
                                  {section.timeframe}
                                </span>
                              </div>
                            )}
                            {image && (
                              <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                              <img 
                                  src={image} 
                                  alt={section?.timeframe || `Chart After ${idx + 1}`} 
                                  className="w-full h-auto object-contain cursor-pointer hover:opacity-80 transition-opacity block"
                                  style={{ 
                                    imageRendering: 'auto',
                                    maxWidth: '100%',
                                    height: 'auto',
                                  }}
                                  loading="eager"
                                  decoding="sync"
                                  onClick={() => onImageClick(images, beforeImages.length + idx)} 
                                />
                              </div>
                            )}
                            {section?.notes && (
                              <div className="rounded-lg border border-border bg-muted/50 p-3 mt-3">
                                <p className="text-sm text-foreground whitespace-pre-wrap break-words">{section.notes}</p>
                              </div>
                            )}
                          </div>;
                        });
                      })()}
                    </div>
                  )}
                </div>;
              })()}

              {/* Linked Forecast Charts */}
              {trade.forecastId && forecasts[trade.forecastId]?.charts && forecasts[trade.forecastId].charts.length > 0}
            </div>}

          {/* PRE-MARKET TAB */}
          {activeTab === 'pre-market' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {(() => {
                // Parse pre-market notes to extract timeframe sections
                // Handle both [Timeframe]\nnotes and [Timeframe]\n formats (image with no notes)
                const parsePreMarketSections = () => {
                  if (!trade.preMarketNotes) return [];
                  // Split by sections that start with [something] - but keep the delimiter
                  const sectionMatches = trade.preMarketNotes.match(/\[[^\]]+\](?:\n[\s\S]*?)?(?=\n\n\[|\n\[|$)/g);
                  if (!sectionMatches) return [];
                  return sectionMatches.map(section => {
                    const match = section.match(/^\[([^\]]+)\]\n?([\s\S]*)/);
                    if (match) {
                      return { timeframe: match[1], notes: match[2]?.trim() || '' };
                    }
                    return { timeframe: null, notes: section.trim() };
                  }).filter(s => s.timeframe);
                };
                
                const chartSections = parsePreMarketSections();
                const images = trade.preMarketImages || [];
                const hasChartContent = images.length > 0 || chartSections.length > 0;

                return <>
                  {hasChartContent && <div className="space-y-4">
                    {(() => {
                      const cardCount = Math.max(images.length, chartSections.length);
                      return Array.from({ length: cardCount }).map((_, idx) => {
                        const image = images[idx];
                        const section = chartSections[idx];
                        
                        return <div key={idx} className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded bg-muted text-sm font-medium text-foreground">
                              {section?.timeframe || `Chart ${idx + 1}`}
                            </span>
                          </div>
                          {image && <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                            <img 
                              src={image} 
                              alt={section?.timeframe || `Chart ${idx + 1}`} 
                              className="w-full h-auto object-contain cursor-pointer hover:opacity-80 transition-opacity block"
                              style={{ 
                                imageRendering: 'auto',
                                maxWidth: '100%',
                                height: 'auto',
                              }}
                              loading="eager"
                              decoding="sync"
                              onClick={() => onImageClick(images, idx)} 
                            />
                          </div>}
                          {section?.notes && <div className="rounded-lg border border-border bg-muted/50 p-3 mt-3">
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{section.notes}</p>
                          </div>}
                        </div>;
                      });
                    })()}
                  </div>}

                  {trade.preMarketPlan && <div className="space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Pre-Market Analysis</span>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.preMarketPlan}</p>
                    </div>
                  </div>}

                  {!hasChartContent && !trade.preMarketPlan && <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No pre-market analysis recorded</p>
                  </div>}
                </>;
              })()}
            </div>}

          {/* POST-MARKET TAB */}
          {activeTab === 'post-market' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {(() => {
                // Parse post-market notes to extract timeframe sections
                // Handle both [Timeframe]\nnotes and [Timeframe]\n formats (image with no notes)
                const parsePostMarketSections = () => {
                  if (!trade.postMarketNotes) return [];
                  // Split by sections that start with [something] - but keep the delimiter
                  const sectionMatches = trade.postMarketNotes.match(/\[[^\]]+\](?:\n[\s\S]*?)?(?=\n\n\[|\n\[|$)/g);
                  if (!sectionMatches) return [];
                  return sectionMatches.map(section => {
                    const match = section.match(/^\[([^\]]+)\]\n?([\s\S]*)/);
                    if (match) {
                      return { timeframe: match[1], notes: match[2]?.trim() || '' };
                    }
                    return { timeframe: null, notes: section.trim() };
                  }).filter(s => s.timeframe);
                };
                
                const chartSections = parsePostMarketSections();
                const images = trade.postMarketImages || [];
                const hasChartContent = images.length > 0 || chartSections.length > 0;

                return <>
                  {hasChartContent && <div className="space-y-4">
                    {(() => {
                      const cardCount = Math.max(images.length, chartSections.length);
                      return Array.from({ length: cardCount }).map((_, idx) => {
                        const image = images[idx];
                        const section = chartSections[idx];
                        
                        return <div key={idx} className="space-y-3 p-4 rounded-lg border border-border bg-muted/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded bg-muted text-sm font-medium text-foreground">
                              {section?.timeframe || `Chart ${idx + 1}`}
                            </span>
                          </div>
                          {image && <div className="rounded-lg border border-border overflow-hidden bg-muted/30">
                            <img 
                              src={image} 
                              alt={section?.timeframe || `Chart ${idx + 1}`} 
                              className="w-full h-auto object-contain cursor-pointer hover:opacity-80 transition-opacity block"
                              style={{ 
                                imageRendering: 'auto',
                                maxWidth: '100%',
                                height: 'auto',
                              }}
                              loading="eager"
                              decoding="sync"
                              onClick={() => onImageClick(images, idx)} 
                            />
                          </div>}
                          {section?.notes && <div className="rounded-lg border border-border bg-muted/50 p-3 mt-3">
                            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{section.notes}</p>
                          </div>}
                        </div>;
                      });
                    })()}
                  </div>}

                  {trade.postMarketReview && <div className="space-y-1.5">
                    <span className="text-sm font-semibold text-foreground">Post-Market Review</span>
                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.postMarketReview}</p>
                    </div>
                  </div>}

                  {!hasChartContent && !trade.postMarketReview && <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No post-market review recorded</p>
                  </div>}
                </>;
              })()}
            </div>}

          {/* EMOTIONS TAB */}
          {activeTab === 'emotions' && <div className="space-y-6 animate-in fade-in-0 duration-300 ease-out">
              {/* Emotional State */}
              {trade.emotionalState && <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <EmotionIcon className={cn('h-5 w-5 flex-shrink-0', currentEmotion.color)} />
                  <span className="text-sm text-muted-foreground">Mood:</span>
                  <span className="text-sm font-medium text-foreground">{currentEmotion.label}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden ml-auto max-w-24">
                    <div className={cn('h-full rounded-full', trade.emotionalState === 1 ? 'bg-pnl-negative' : trade.emotionalState === 2 ? 'bg-amber-500' : 'bg-pnl-positive')} style={{ width: `${trade.emotionalState / 3 * 100}%` }} />
                  </div>
                </div>}

              {trade.emotionalJournalBefore ? <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-foreground">Before Trade</span>
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.emotionalJournalBefore}</p>
                  </div>
                </div> : null}

              {trade.emotionalJournalDuring ? <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-foreground">During Trade</span>
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.emotionalJournalDuring}</p>
                  </div>
                </div> : null}

              {trade.emotionalJournalAfter ? <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-foreground">After Trade</span>
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.emotionalJournalAfter}</p>
                  </div>
                </div> : null}

              {trade.overallEmotions ? <div className="space-y-1.5">
                  <span className="text-sm font-semibold text-foreground">Overall Emotions</span>
                  <div className="rounded-lg border border-border bg-muted/50 p-3">
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{trade.overallEmotions}</p>
                  </div>
                </div> : null}

              {!trade.emotionalJournalBefore && !trade.emotionalJournalDuring && !trade.emotionalJournalAfter && !trade.overallEmotions && <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">No emotional notes recorded</p>
                </div>}
            </div>}
        </div>

        {/* Footer - same style as TradeForm with safe area padding */}
        <div className="px-4 md:px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onEdit(activeTab)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>;
}