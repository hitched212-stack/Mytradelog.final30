import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradingPreferences } from '@/hooks/useTradingPreferences';
import { Plus, X, Check, Loader2, Pencil, ListChecks, AlertTriangle, ArrowRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTrades } from '@/hooks/useTrades';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function TradingRulesSettings() {
  const navigate = useNavigate();
  const {
    tradingRules,
    isLoading,
    addTradingRule,
    updateTradingRule,
    removeTradingRule
  } = useTradingPreferences();
  const { trades, isLoading: tradesLoading } = useTrades();
  const { toast } = useToast();
  const [newRule, setNewRule] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [selectedRuleForDetails, setSelectedRuleForDetails] = useState<string | null>(null);

  // Calculate compliance metrics
  const complianceMetrics = useMemo(() => {
    if (!trades || trades.length === 0 || tradingRules.length === 0) {
      return { overallCompliance: 0, ruleBreakdown: [] };
    }

    const tradesWithRuleData = trades.filter(
      t => (t.followedRulesList && t.followedRulesList.length > 0) || 
           (t.brokenRules && t.brokenRules.length > 0)
    );

    if (tradesWithRuleData.length === 0) {
      return { overallCompliance: 0, ruleBreakdown: [] };
    }

    // Calculate per-rule compliance
    const ruleBreakdown = tradingRules.map((rule) => {
      let followed = 0;
      let broken = 0;

      tradesWithRuleData.forEach((trade) => {
        if (trade.followedRulesList?.includes(rule)) followed++;
        if (trade.brokenRules?.includes(rule)) broken++;
      });

      const total = followed + broken;
      const compliance = total > 0 ? (followed / total) * 100 : 0;

      return {
        rule,
        followed,
        broken,
        compliance,
        total
      };
    });

    // Calculate overall compliance
    const totalFollowed = tradesWithRuleData.reduce((sum, t) => sum + (t.followedRulesList?.length || 0), 0);
    const totalBroken = tradesWithRuleData.reduce((sum, t) => sum + (t.brokenRules?.length || 0), 0);
    const overallCompliance = totalFollowed + totalBroken > 0 
      ? (totalFollowed / (totalFollowed + totalBroken)) * 100 
      : 0;

    return { overallCompliance, ruleBreakdown };
  }, [trades, tradingRules]);

  const handleAddRule = async () => {
    if (newRule.trim()) {
      await addTradingRule(newRule.trim());
      setNewRule('');
      toast({ title: 'Rule added' });
    }
  };

  const handleEditRule = (index: number, rule: string) => {
    setEditingIndex(index);
    setEditValue(rule);
  };

  const handleSaveEdit = async () => {
    if (editingIndex !== null && editValue.trim()) {
      await updateTradingRule(editingIndex, editValue.trim());
      setEditingIndex(null);
      setEditValue('');
      toast({ title: 'Rule updated' });
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const getViolatedTrades = (rule: string) => {
    if (!trades) return [];
    return trades.filter(t => t.brokenRules?.includes(rule) || false);
  };

  const handleRemoveRule = async (index: number) => {
    await removeTradingRule(index);
    toast({ title: 'Rule removed' });
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8 sr-only">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">Trading Rules</h1>
            <p className="text-sm text-muted-foreground">Define your trading discipline</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 md:px-6 lg:px-8 space-y-6">
        {/* Combined Compliance + Add Rule Card */}
        <div className="rounded-2xl bg-card border border-border/40 shadow-sm px-4 pb-4 pt-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">Trading Rules</h2>
              <p className="text-xs text-muted-foreground">{tradingRules.length} total {tradingRules.length === 1 ? 'rule' : 'rules'}</p>
            </div>

            <div className="hidden sm:block h-7 w-px bg-border/50" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Compliance</span>
              <span className={cn(
                "text-xl font-display font-bold tabular-nums",
                !tradesLoading && tradingRules.length > 0 && complianceMetrics.ruleBreakdown.some(r => r.total > 0)
                  ? complianceMetrics.overallCompliance >= 80 ? "text-pnl-positive" :
                    complianceMetrics.overallCompliance >= 60 ? "text-amber-500" : "text-pnl-negative"
                  : "text-muted-foreground"
              )}>
                {!tradesLoading && tradingRules.length > 0 && complianceMetrics.ruleBreakdown.some(r => r.total > 0)
                  ? `${complianceMetrics.overallCompliance.toFixed(0)}%`
                  : '—'}
              </span>
            </div>

            <div className="hidden md:block h-7 w-px bg-border/50" />

            <div className="flex-1 min-w-[220px]">
              <div className="flex gap-2">
                <Input
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Add a new rule..."
                  className="flex-1 h-9 bg-background/60 border-border/50 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
                />
                <Button
                  onClick={handleAddRule}
                  size="icon"
                  className="h-9 w-9 bg-foreground text-background hover:bg-foreground/90"
                  disabled={!newRule.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {!tradesLoading && tradingRules.length > 0 && complianceMetrics.ruleBreakdown.some(r => r.total > 0) && (
            <div className="mt-4">
              <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    complianceMetrics.overallCompliance >= 80 ? "bg-pnl-positive" :
                    complianceMetrics.overallCompliance >= 60 ? "bg-amber-500" : "bg-pnl-negative"
                  )}
                  style={{ width: `${complianceMetrics.overallCompliance}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Rules list - Always visible, showing loading state for metrics */}
        {tradingRules.length > 0 ? (
          <div className="space-y-2">
            {tradingRules.map((rule, index) => {
              const ruleMetrics = complianceMetrics.ruleBreakdown.find(r => r.rule === rule);
              const hasMetrics = !tradesLoading && ruleMetrics && ruleMetrics.total > 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "rounded-2xl border border-border/50 overflow-hidden group transition-all duration-200 relative",
                    "hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20",
                    editingIndex === index
                      ? "bg-card"
                      : "cursor-pointer p-4 bg-card"
                  )}
                  onClick={() => editingIndex === null && setSelectedRuleForDetails(rule)}
                >
                  {editingIndex === index ? (
                    <div className="flex items-center gap-3 p-4">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 h-9 bg-muted/30 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 hover:bg-pnl-positive/10 rounded-lg transition-colors"
                      >
                        <Check className="h-4 w-4 text-pnl-positive" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-6">
                      {/* Left side - Rule name and indicator */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{rule}</h3>
                          {hasMetrics && (
                            <p className="text-xs text-muted-foreground">{ruleMetrics.total} trades tracked</p>
                          )}
                        </div>
                      </div>

                      {/* Center - Stats */}
                      <div className="flex items-center gap-6 flex-wrap justify-end">
                        {tradesLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : hasMetrics ? (
                          <>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Compliance</p>
                              <p className={cn(
                                "text-sm font-semibold",
                                ruleMetrics.compliance >= 80 ? "text-pnl-positive" :
                                ruleMetrics.compliance >= 60 ? "text-amber-500" : "text-pnl-negative"
                              )}>
                                {ruleMetrics.compliance.toFixed(0)}%
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Followed</p>
                              <p className="text-sm font-semibold text-pnl-positive">{ruleMetrics.followed}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Broken</p>
                              <p className="text-sm font-semibold text-pnl-negative">{ruleMetrics.broken}</p>
                            </div>
                          </>
                        ) : null}
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(event) => event.stopPropagation()}
                              className="p-2 hover:bg-muted rounded-lg"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[140px]">
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditRule(index, rule);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                              Edit rule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => {
                                event.stopPropagation();
                                handleRemoveRule(index);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <X className="mr-2 h-4 w-4 text-destructive" />
                              Delete rule
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No rules defined yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Trading rules help you stay disciplined and consistent.
              Add your first rule above to get started.
            </p>
          </div>
        )}
      </div>

      {/* Violated Trades Modal */}
      <Dialog open={!!selectedRuleForDetails} onOpenChange={(open) => !open && setSelectedRuleForDetails(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto pt-8">
          <DialogHeader className="-mt-2 mb-6">
            <DialogTitle className="text-lg font-bold uppercase tracking-widest">Trades That Violated: {selectedRuleForDetails}</DialogTitle>
          </DialogHeader>
          
          {selectedRuleForDetails && (() => {
            const violatedTrades = getViolatedTrades(selectedRuleForDetails);
            
            return (
              <div className="space-y-2">
                {violatedTrades.length > 0 ? (
                  violatedTrades.map((trade) => (
                    <button
                      key={trade.id}
                      onClick={() => {
                        navigate(`/history?tradeId=${trade.id}`);
                        setSelectedRuleForDetails(null);
                      }}
                      className="w-full text-left p-4 rounded-lg bg-card border border-border/50 hover:bg-card/80 hover:border-border transition-all group"
                    >
                      <div className="flex items-center justify-between gap-6">
                        {/* Left - Symbol and Date */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 rounded-full bg-pnl-negative/60" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-foreground text-sm">{trade.symbol || 'Unknown'}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{trade.date ? format(new Date(trade.date), 'MMM d, yyyy') : 'No date'}</span>
                              {trade.entryTime && (
                                <>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span>{trade.entryTime}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Center - PnL */}
                        <div className="text-right flex-shrink-0">
                          <p className={cn(
                            "text-sm font-semibold",
                            trade.pnlAmount && trade.pnlAmount >= 0 
                              ? "text-pnl-positive"
                              : "text-pnl-negative"
                          )}>
                            {trade.pnlAmount ? (trade.pnlAmount >= 0 ? '+' : '') + trade.pnlAmount.toFixed(2) : '—'}
                          </p>
                        </div>

                        {/* Right - Arrow */}
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
                      </div>

                      {/* Notes if present */}
                      {trade.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 pl-6">{trade.notes}</p>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No trades violated this rule</p>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}