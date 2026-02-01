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
    label: 'Daily Goal'
  }, {
    key: 'weekly' as const,
    label: 'Weekly Goal'
  }, {
    key: 'monthly' as const,
    label: 'Monthly Goal'
  }, {
    key: 'yearly' as const,
    label: 'Yearly Goal'
  }];

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">P&L Goals</h1>
            <p className="text-sm text-muted-foreground">Set your trading targets</p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8 space-y-4">
        {goalPeriods.map(({ key, label }) => (
          <div key={key} className="rounded-xl bg-card border border-border/50 p-4">
            <label className="text-sm font-medium text-foreground mb-3 block">
              {label}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-display font-bold tabular-nums text-sm">
                {currencySymbol}
              </span>
              <Input
                type="number"
                value={goals[key]}
                onChange={(e) => setGoalsLocal((prev) => ({
                  ...prev,
                  [key]: e.target.value
                }))}
                className="pl-9 h-11 font-display font-bold tabular-nums bg-muted/30 border-border/50 text-base"
                placeholder="0"
              />
            </div>
          </div>
        ))}

        <Button
          onClick={handleSave}
          className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 mt-6"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}