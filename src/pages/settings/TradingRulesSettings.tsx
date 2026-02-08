import { useState, useMemo } from 'react';
import { useTradingPreferences } from '@/hooks/useTradingPreferences';
import { Plus, X, Check, Loader2, Pencil, ListChecks, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTrades } from '@/hooks/useTrades';
import { cn } from '@/lib/utils';

export default function TradingRulesSettings() {
  const {
    tradingRules,
    isLoading,
    addTradingRule,
    updateTradingRule,
    removeTradingRule
  } = useTradingPreferences();
  const { trades } = useTrades();
  const { toast } = useToast();
  const [newRule, setNewRule] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const handleRemoveRule = async (index: number) => {
    await removeTradingRule(index);
    toast({ title: 'Rule removed' });
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-foreground">Trading Rules</h1>
            <p className="text-sm text-muted-foreground">Define your trading discipline</p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        {/* Overall Compliance Card */}
        {tradingRules.length > 0 && complianceMetrics.ruleBreakdown.some(r => r.total > 0) && (
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Overall Compliance</h3>
              <span className={cn(
                "text-2xl font-display font-bold tabular-nums",
                complianceMetrics.overallCompliance >= 80 ? "text-pnl-positive" :
                complianceMetrics.overallCompliance >= 60 ? "text-amber-500" : "text-pnl-negative"
              )}>
                {complianceMetrics.overallCompliance.toFixed(0)}%
              </span>
            </div>
            
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden mb-4">
              <div 
                className={cn(
                  "h-full rounded-full",
                  complianceMetrics.overallCompliance >= 80 ? "bg-pnl-positive" :
                  complianceMetrics.overallCompliance >= 60 ? "bg-amber-500" : "bg-pnl-negative"
                )}
                style={{ width: `${complianceMetrics.overallCompliance}%` }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {complianceMetrics.overallCompliance >= 80 
                ? "Excellent! You're following your rules consistently."
                : complianceMetrics.overallCompliance >= 60
                ? "Good progress. Focus on improving consistency."
                : "You're breaking rules frequently. Review and recommit to your trading plan."}
            </p>
          </div>
        )}

        {/* Add new rule input */}
        <div className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-sm p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">Add New Rule</h3>
            <p className="text-xs text-muted-foreground">
              Define a trading rule you want to track and improve
            </p>
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              placeholder="E.g., Only trade between 9am-12pm or Max 3 trades per day..."
              className="flex-1 h-11 bg-background/50 border-border/50 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            />
            <Button
              onClick={handleAddRule}
              size="icon"
              className="h-11 w-11 bg-foreground text-background hover:bg-foreground/90"
              disabled={!newRule.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Rules list or empty state */}
        {tradingRules.length > 0 ? (
          <div className="space-y-2">
            {tradingRules.map((rule, index) => {
              const ruleMetrics = complianceMetrics.ruleBreakdown.find(r => r.rule === rule);
              const hasMetrics = ruleMetrics && ruleMetrics.total > 0;

              return (
                <div
                  key={index}
                  className="rounded-xl bg-card border border-border/50 overflow-hidden group transition-all hover:border-border"
                >
                  <div className="flex items-center gap-3 p-4">
                    {editingIndex === index ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <div className="w-6 h-6 rounded-full bg-pnl-positive/10 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3.5 w-3.5 text-pnl-positive" />
                        </div>
                        <span className="flex-1 text-sm text-foreground">{rule}</span>
                        {hasMetrics && (
                          <span className={cn(
                            "text-xs font-semibold tabular-nums",
                            ruleMetrics.compliance >= 80 ? "text-pnl-positive" :
                            ruleMetrics.compliance >= 60 ? "text-amber-500" : "text-pnl-negative"
                          )}>
                            {ruleMetrics.compliance.toFixed(0)}%
                          </span>
                        )}
                        <button
                          onClick={() => handleEditRule(index, rule)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded-lg"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleRemoveRule(index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-destructive/10 rounded-lg"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Rule compliance breakdown */}
                  {hasMetrics && editingIndex !== index && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/50 bg-muted/20">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-pnl-positive">
                            {ruleMetrics.followed} followed
                          </span>
                          <span className="text-pnl-negative">
                            {ruleMetrics.broken} broken
                          </span>
                        </div>
                        {ruleMetrics.compliance < 70 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Needs attention</span>
                          </div>
                        )}
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mt-2">
                        <div 
                          className={cn(
                            "h-full",
                            ruleMetrics.compliance >= 80 ? "bg-pnl-positive" :
                            ruleMetrics.compliance >= 60 ? "bg-amber-500" : "bg-pnl-negative"
                          )}
                          style={{ width: `${ruleMetrics.compliance}%` }}
                        />
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
    </div>
  );
}