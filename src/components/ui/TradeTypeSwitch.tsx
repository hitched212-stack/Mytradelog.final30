import { cn } from '@/lib/utils';

type TradeType = 'real' | 'paper' | 'no_trade';

const tradeTypes: { value: TradeType; label: string }[] = [
  { value: 'real', label: 'Real' },
  { value: 'paper', label: 'Paper' },
  { value: 'no_trade', label: 'No Trade' },
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

  // Calculate the position of the sliding background
  const activeIndex = tradeTypes.findIndex(t => t.value === value);
  const slidePercentage = (activeIndex * 100) / tradeTypes.length;

  return (
    <div className="relative flex gap-0 rounded-lg overflow-hidden border border-border/60 dark:border-white/10 bg-muted/40 dark:bg-white/5">
      {/* Sliding background */}
      <div
        className="absolute top-0 bottom-0 transition-all duration-500 rounded-md bg-primary/10"
        style={{
          width: `${100 / tradeTypes.length}%`,
          left: `${slidePercentage}%`,
        }}
      />
      
      {/* Buttons */}
      <div className="flex gap-0 w-full relative z-10">
        {tradeTypes.map((tradeType) => {
          const isActive = value === tradeType.value;
          
          return (
            <button
              key={tradeType.value}
              type="button"
              onClick={() => handleChange(tradeType.value)}
              className={cn(
                "flex-1 flex items-center justify-center h-10 px-4 text-sm font-medium transition-colors duration-500",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              <span>{tradeType.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
