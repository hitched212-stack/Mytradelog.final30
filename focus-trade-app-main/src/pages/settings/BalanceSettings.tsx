import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrencySymbol } from '@/types/trade';

export default function BalanceSettings() {
  const navigate = useNavigate();
  const { settings, setAccountBalance } = useSettings();
  const { toast } = useToast();
  const currencySymbol = getCurrencySymbol(settings.currency);
  const [balance, setBalance] = useState((settings.accountBalance || 0).toString());

  useEffect(() => {
    setBalance((settings.accountBalance || 0).toString());
  }, [settings.accountBalance]);

  const handleSave = () => {
    const numValue = parseFloat(balance) || 0;
    setAccountBalance(numValue);
    toast({
      title: 'Account balance updated',
      description: `Balance set to ${currencySymbol}${numValue.toLocaleString()}`
    });
    navigate('/settings/trading');
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <button
          onClick={() => navigate('/settings/trading')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Account Balance</h1>
            <p className="text-sm text-muted-foreground">Your trading capital</p>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="rounded-2xl bg-card border border-border/50 p-6">
          <label className="block text-sm font-medium text-foreground mb-3">
            Current Balance
          </label>
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
              {currencySymbol}
            </span>
            <Input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="pl-10 h-14 text-xl font-display tabular-nums bg-muted/50 border-border/50"
              placeholder="10000"
            />
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            This is your initial trading capital. P&L will be calculated based on this amount.
          </p>
          <Button
            onClick={handleSave}
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}