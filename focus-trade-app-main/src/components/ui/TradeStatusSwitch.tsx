import { cn } from '@/lib/utils';
import { LockOpen, Lock } from 'lucide-react';

interface TradeStatusSwitchProps {
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
  className?: string;
}

export function TradeStatusSwitch({ isOpen, onChange, className }: TradeStatusSwitchProps) {
  return (
    <div className={cn(
      "grid grid-cols-2 gap-2",
      className
    )}>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 justify-center border",
          isOpen
            ? "bg-pnl-positive/15 text-pnl-positive border-pnl-positive/30"
            : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground"
        )}
      >
        <LockOpen className="h-4 w-4" strokeWidth={1.5} />
        <span>Open</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 justify-center border",
          !isOpen
            ? "bg-primary/10 text-primary border-primary/20"
            : "bg-secondary text-muted-foreground border-border hover:bg-muted hover:text-foreground"
        )}
      >
        <Lock className="h-4 w-4" strokeWidth={1.5} />
        <span>Closed</span>
      </button>
    </div>
  );
}
