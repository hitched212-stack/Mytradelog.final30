import { cn } from '@/lib/utils';

interface SegmentData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface SegmentedBarChartProps {
  data: SegmentData[];
  barHeight?: number;
  gap?: number;
  className?: string;
}

export function SegmentedBarChart({ 
  data, 
  barHeight = 12,
  gap = 2,
  className 
}: SegmentedBarChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  if (total === 0) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <div 
          className="w-full rounded-full bg-muted overflow-hidden flex"
          style={{ height: barHeight }}
        >
          <div className="w-full h-full bg-muted" />
        </div>
        <p className="text-sm text-muted-foreground text-center">No data available</p>
      </div>
    );
  }

  // Sort data by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Segmented Bar */}
      <div 
        className="w-full overflow-hidden flex"
        style={{ height: barHeight, gap: `${gap}px` }}
      >
        {sortedData.map((item, index) => (
          <div
            key={item.name}
            className="h-full transition-all duration-300"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: item.color,
              borderRadius: index === 0 ? '4px 0 0 4px' : index === sortedData.length - 1 ? '0 4px 4px 0' : '0',
            }}
            title={`${item.name}: ${item.percentage.toFixed(1)}%`}
          />
        ))}
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {sortedData.map((item) => (
          <div key={item.name} className="flex items-center gap-2">
            <div 
              className="w-2.5 h-2.5 rounded-full shrink-0" 
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-muted-foreground">{item.name}</span>
            <span className="text-xs font-display font-bold tabular-nums text-foreground">
              {item.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
