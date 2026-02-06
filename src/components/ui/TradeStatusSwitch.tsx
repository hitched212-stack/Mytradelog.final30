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
      "relative flex gap-0 rounded-xl overflow-hidden border border-border/50 bg-card/85 dark:bg-card/70 backdrop-blur-xl p-1",
      className
    )}>
      {/* Sliding background */}
      <div
        className={cn(
          "absolute top-1 bottom-1 transition-all duration-500 rounded-lg pointer-events-none shadow-sm",
          isOpen ? "border border-pnl-positive/30 bg-pnl-positive/10" : "border border-pnl-negative/30 bg-pnl-negative/10"
        )}
        style={{
          width: "calc(50% - 0.5rem)",
          left: isOpen ? "0.25rem" : "calc(50% + 0.25rem)",
        }}
      />
      
      {/* Buttons */}
      <div className="flex gap-0 w-full relative z-10">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "flex-1 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-500 justify-center rounded-lg",
            isOpen
              ? "text-pnl-positive"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          <LockOpen className="h-4 w-4 transition-transform duration-500" strokeWidth={1.5} />
          <span>Open</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-500 justify-center rounded-lg",
            !isOpen
              ? "text-pnl-negative"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          <Lock className="h-4 w-4 transition-transform duration-500" strokeWidth={1.5} />
          <span>Closed</span>
        </button>
      </div>
    </div>
  );
}
