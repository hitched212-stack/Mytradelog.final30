import { cn } from '@/lib/utils';
interface WinRateGaugeProps {
  wins: number;
  losses: number;
  className?: string;
}
export function WinRateGauge({
  wins,
  losses,
  className
}: WinRateGaugeProps) {
  const total = wins + losses;
  const winPercent = total > 0 ? wins / total * 100 : 50;
  const lossPercent = 100 - winPercent;
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{wins}W</span>
        <span>{total > 0 ? winPercent.toFixed(0) : 0}%</span>
        <span>{losses}L</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
        <div 
          className="h-full bg-emerald-500 transition-all duration-300" 
          style={{ width: `${winPercent}%` }} 
        />
        <div 
          className="h-full bg-destructive transition-all duration-300" 
          style={{ width: `${lossPercent}%` }} 
        />
      </div>
    </div>
  );
}