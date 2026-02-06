import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { useAccount } from '@/hooks/useAccount';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol, PnlGoals } from '@/types/trade';

export default function GoalsSettings() {
  const navigate = useNavigate();
  const { settings, setGoals } = useSettings();
  const { activeAccount } = useAccount();
  const { toast } = useToast();
  const currencySymbol = getCurrencySymbol((activeAccount?.currency || settings.currency) as any);
  const [goals, setGoalsLocal] = useState({
    daily: settings.goals.daily.toString(),
    weekly: settings.goals.weekly.toString(),
    monthly: settings.goals.monthly.toString(),
    yearly: settings.goals.yearly.toString()
  });

  useEffect(() => {
    setGoalsLocal({
      daily: settings.goals.daily.toString(),
      weekly: settings.goals.weekly.toString(),
      monthly: settings.goals.monthly.toString(),
      yearly: settings.goals.yearly.toString()
    });
  }, [settings.goals]);

  const handleSave = async () => {
    const numericGoals: PnlGoals = {
      daily: parseFloat(goals.daily) || 0,
      weekly: parseFloat(goals.weekly) || 0,
      monthly: parseFloat(goals.monthly) || 0,
      yearly: parseFloat(goals.yearly) || 0
    };
    await setGoals(numericGoals);
    toast({
      title: 'Goals updated',
      description: 'Your P&L goals have been saved',
      variant: 'success'
    });
  };

  const goalPeriods = [{
    key: 'daily' as const,
    label: 'Daily Goal',
    description: 'Target profit per trading day'
  }, {
    key: 'weekly' as const,
    label: 'Weekly Goal',
    description: 'Target profit per week'
  }, {
    key: 'monthly' as const,
    label: 'Monthly Goal',
    description: 'Target profit per month'
  }, {
    key: 'yearly' as const,
    label: 'Yearly Goal',
    description: 'Target profit per year'
  }];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 md:px-6 lg:px-8">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-foreground">P&L Goals</h1>
          <p className="text-sm text-muted-foreground">Set your trading targets</p>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 space-y-6">
        {/* Goal Settings */}
        <div className="space-y-4">
          {goalPeriods.map(({ key, label, description }) => (
            <div 
              key={key} 
              className="rounded-2xl bg-card border border-border/50 overflow-hidden hover:border-border transition-colors"
            >
              <div className="p-5">
                {/* Header */}
                <div className="mb-4">
                  <label className="text-sm font-semibold text-foreground block">
                    {label}
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>

                {/* Input */}
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-display font-bold tabular-nums text-base">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    value={goals[key]}
                    onChange={(e) => setGoalsLocal((prev) => ({
                      ...prev,
                      [key]: e.target.value
                    }))}
                    className="pl-10 h-12 font-display font-bold tabular-nums bg-muted/30 border-border/50 text-lg rounded-xl focus:ring-2 focus:ring-primary/20"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="sticky bottom-20 md:bottom-6 pt-4">
          <Button
            onClick={handleSave}
            className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg font-semibold"
          >
            Save Goals
          </Button>
        </div>
      </div>
    </div>
  );
}