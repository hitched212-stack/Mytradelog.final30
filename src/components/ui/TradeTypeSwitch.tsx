import { cn } from '@/lib/utils';
import { CircleDollarSign, FileText, CircleSlash } from 'lucide-react';

type TradeType = 'real' | 'paper' | 'no_trade';

const tradeTypes: { value: TradeType; icon: typeof CircleDollarSign; label: string }[] = [
  { value: 'real', icon: CircleDollarSign, label: 'Real' },
  { value: 'paper', icon: FileText, label: 'Paper' },
  { value: 'no_trade', icon: CircleSlash, label: 'No Trade' },
];

interface TradeTypeSwitchProps {
  isPaperTrade: boolean;
  noTradeTaken: boolean;
  onChange: (isPaperTrade: boolean, noTradeTaken: boolean) => void;
}

export function TradeTypeSwitch({ isPaperTrade, noTradeTaken, onChange }: TradeTypeSwitchProps) {
  // Determine current value from props
  const value: TradeType = noTradeTaken ? 'no_trade' : isPaperTrade ? 'paper' : 'real';

  const handleChange = (newValue: TradeType) => {
    switch (newValue) {
      case 'real':
        onChange(false, false);
        break;
      case 'paper':
        onChange(true, false);
        break;
      case 'no_trade':
        onChange(false, true);
        break;
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {tradeTypes.map((tradeType) => {
        const Icon = tradeType.icon;
        const isActive = value === tradeType.value;
        
        return (
          <button
            key={tradeType.value}
            type="button"
            onClick={() => handleChange(tradeType.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200 border",
              isActive
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-black/[0.06] dark:bg-secondary text-muted-foreground border-border/50 hover:bg-black/[0.1] dark:hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
            <span className="hidden xs:inline sm:inline">{tradeType.label}</span>
          </button>
        );
      })}
    </div>
  );
}
