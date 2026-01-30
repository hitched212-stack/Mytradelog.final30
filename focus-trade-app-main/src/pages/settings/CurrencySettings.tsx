import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/hooks/useSettings';
import { ArrowLeft, DollarSign, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Currency, CURRENCIES } from '@/types/trade';

export default function CurrencySettings() {
  const navigate = useNavigate();
  const { settings, setCurrency } = useSettings();
  const { toast } = useToast();

  const handleSelect = (currency: Currency) => {
    setCurrency(currency);
    toast({
      title: 'Currency updated',
      description: `Display currency set to ${currency}`
    });
    navigate('/settings/trading');
  };

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 pt-6 pb-6 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/settings/trading')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Currency</h1>
              <p className="text-sm text-muted-foreground">Display preference</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-card border border-border/50 overflow-hidden divide-y divide-border/50">
            {CURRENCIES.map((currency) => (
              <button
                key={currency.value}
                onClick={() => handleSelect(currency.value)}
                className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-semibold text-foreground">
                  {currency.symbol}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{currency.value}</p>
                  <p className="text-sm text-muted-foreground">{currency.label}</p>
                </div>
                {settings.currency === currency.value && (
                  <Check className="h-5 w-5 text-foreground/70" strokeWidth={1.5} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}