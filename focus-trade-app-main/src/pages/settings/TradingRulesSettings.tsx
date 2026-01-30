import { useState } from 'react';
import { useTradingPreferences } from '@/hooks/useTradingPreferences';
import { Plus, X, Check, Loader2, Pencil, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function TradingRulesSettings() {
  const {
    tradingRules,
    isLoading,
    addTradingRule,
    updateTradingRule,
    removeTradingRule
  } = useTradingPreferences();
  const { toast } = useToast();
  const [newRule, setNewRule] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Trading Rules</h1>
            <p className="text-sm text-muted-foreground">Define your trading discipline</p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        {/* Add new rule input */}
        <div className="flex gap-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Add a new trading rule..."
            className="flex-1 h-11 bg-muted/30 border-border/50 text-base"
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

        {/* Rules list or empty state */}
        {tradingRules.length > 0 ? (
          <div className="space-y-2">
            {tradingRules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 group transition-all hover:border-border"
              >
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
            ))}
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