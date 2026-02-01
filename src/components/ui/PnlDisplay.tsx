import { cn } from '@/lib/utils';
import { useSettings } from '@/hooks/useSettings';
import { getCurrencySymbol } from '@/types/trade';

interface PnlDisplayProps {
  value: number;
  showPercentage?: boolean;
  percentage?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PnlDisplay({ 
  value, 
  showPercentage = false, 
  percentage,
  size = 'md',
  className 
}: PnlDisplayProps) {
  const { settings } = useSettings();
  const currencySymbol = getCurrencySymbol(settings.currency);
  
  const isPositive = value >= 0;
  const isZero = value === 0;
  
  // Format value - show 0.00 for zero
  const formatValue = (val: number) => {
    return Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <span 
      className={cn(
        'font-semibold tabular-nums font-display',
        isZero ? 'text-muted-foreground' : isPositive ? 'text-pnl-positive' : 'text-pnl-negative',
        sizeClasses[size],
        className
      )}
    >
      {isZero ? '' : isPositive ? '+' : '-'}{currencySymbol}{formatValue(value)}
      {showPercentage && percentage !== undefined && (
        <span className="ml-1 text-muted-foreground font-display">
          ({percentage === 0 ? '0' : `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}`}%)
        </span>
      )}
    </span>
  );
}
