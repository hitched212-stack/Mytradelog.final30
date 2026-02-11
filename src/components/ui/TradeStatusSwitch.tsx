import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { LockOpen, Lock } from 'lucide-react';

interface TradeStatusSwitchProps {
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
  className?: string;
}

export function TradeStatusSwitch({ isOpen, onChange, className }: TradeStatusSwitchProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Set hasMounted after a brief delay to prevent initial animation
    const timer = setTimeout(() => setHasMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      "relative flex gap-0 rounded-xl overflow-hidden border border-border/50 bg-card/85 dark:bg-card/70 backdrop-blur-xl p-1",
      className
    )}>
      {/* Sliding background */}
      <div
        className={cn(
          "absolute top-1 bottom-1 rounded-lg pointer-events-none shadow-sm",
          hasMounted && "transition-all duration-500",
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
            "flex-1 flex items-center gap-2 px-4 py-3 text-sm font-medium justify-center rounded-lg",
            hasMounted && "transition-colors duration-500",
            isOpen
              ? "text-pnl-positive"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          <LockOpen className={cn("h-4 w-4", hasMounted && "transition-transform duration-500")} strokeWidth={1.5} />
          <span>Open</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex-1 flex items-center gap-2 px-4 py-3 text-sm font-medium justify-center rounded-lg",
            hasMounted && "transition-colors duration-500",
            !isOpen
              ? "text-pnl-negative"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          <Lock className={cn("h-4 w-4", hasMounted && "transition-transform duration-500")} strokeWidth={1.5} />
          <span>Closed</span>
        </button>
      </div>
    </div>
  );
}
