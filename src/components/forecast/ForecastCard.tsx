import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, MoreHorizontal, Eye, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ImageZoomDialog } from '@/components/ui/ImageZoomDialog';
import { getTimeframeLabel } from '@/lib/timeframes';

interface ChartAnalysis {
  id: string;
  timeframe: string;
  images: string[];
  notes: string;
}

interface ForecastCardProps {
  id: string;
  symbol: string;
  direction: 'bullish' | 'bearish';
  charts: ChartAnalysis[];
  status: 'pending' | 'completed';
  outcome?: 'win' | 'loss' | null;
  date: string;
  forecast_type?: 'pre_market' | 'post_market';
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: (outcome: 'win' | 'loss') => void;
}

// Short labels for the compact card display
const getShortTimeframeLabel = (value: string): string => {
  const shortLabels: Record<string, string> = {
    '1s': '1S', '5s': '5S', '15s': '15S', '30s': '30S',
    '1m': '1M', '3m': '3M', '5m': '5M', '15m': '15M', '30m': '30M', '45m': '45M',
    '1h': '1H', '2h': '2H', '4h': '4H', '8h': '8H', '12h': '12H',
    '1d': 'D', '1w': 'W', '1M': 'MO',
  };
  return shortLabels[value] || value;
};

// Persist collapsed state in localStorage
const getCollapsedState = (id: string): boolean => {
  try {
    const stored = localStorage.getItem('forecast-collapsed-states');
    if (stored) {
      const states = JSON.parse(stored);
      return states[id] || false;
    }
  } catch {}
  return false;
};

const setCollapsedState = (id: string, collapsed: boolean) => {
  try {
    const stored = localStorage.getItem('forecast-collapsed-states');
    const states = stored ? JSON.parse(stored) : {};
    states[id] = collapsed;
    localStorage.setItem('forecast-collapsed-states', JSON.stringify(states));
  } catch {}
};

export function ForecastCard({
  id,
  symbol,
  direction,
  charts,
  status,
  outcome,
  date,
  forecast_type = 'pre_market',
  onView,
  onEdit,
  onDelete,
  onComplete
}: ForecastCardProps) {
  const isPending = status === 'pending';
  const isWin = outcome === 'win';
  const isLoss = outcome === 'loss';
  const isPreMarket = forecast_type === 'pre_market';
  
  const [isCollapsed, setIsCollapsed] = useState(() => getCollapsedState(id));
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  
  // Persist collapsed state when it changes
  useEffect(() => {
    setCollapsedState(id, isCollapsed);
  }, [id, isCollapsed]);
  
  const handleImageClick = (images: string[], index: number) => {
    setZoomImages(images);
    setZoomIndex(index);
    setZoomOpen(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center justify-center h-10 w-10 rounded-lg',
            direction === 'bullish' ? 'bg-pnl-positive/20' : 'bg-pnl-negative/20'
          )}>
            {direction === 'bullish' ? (
              <TrendingUp className="h-5 w-5 text-pnl-positive" />
            ) : (
              <TrendingDown className="h-5 w-5 text-pnl-negative" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg">{symbol}</span>
              <span className={cn(
                'px-3 py-0.5 rounded-full text-xs font-semibold uppercase',
                direction === 'bullish' ? 'bg-pnl-positive/20 text-pnl-positive' : 'bg-pnl-negative/20 text-pnl-negative'
              )}>
                {direction}
              </span>
              <span className={cn(
                'px-3 py-0.5 rounded-full text-xs font-semibold',
                isPreMarket ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
              )}>
                {isPreMarket ? 'Pre-Market' : 'Post-Market'}
              </span>
              {!isPending && (
                <span className={cn(
                  'px-3 py-0.5 rounded-full text-xs font-semibold uppercase',
                  isWin ? 'bg-pnl-positive/20 text-pnl-positive' : 'bg-pnl-negative/20 text-pnl-negative'
                )}>
                  {outcome}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3" />
              {format(new Date(date), 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-transparent active:bg-transparent">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => setIsCollapsed(!isCollapsed)}>
              {isCollapsed ? (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Collapse
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart Analysis - Collapsible */}
      {!isCollapsed && charts && charts.length > 0 && (
        <div className="space-y-4">
          {charts.map((chart) => (
            <div key={chart.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                  {getShortTimeframeLabel(chart.timeframe)}
                </span>
              </div>
              
              {chart.images && chart.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {chart.images.map((img, idx) => (
                    <div key={idx} className="rounded-lg border border-border overflow-hidden bg-muted aspect-video">
                      <img
                        src={img}
                        alt={`Chart ${idx + 1}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        style={{ imageRendering: 'auto' }}
                        onClick={() => handleImageClick(chart.images, idx)}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {chart.notes && (
                <p className="text-sm text-muted-foreground">{chart.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Collapsed indicator */}
      {isCollapsed && charts && charts.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ChevronDown className="h-4 w-4" />
          <span>{charts.length} timeframe{charts.length !== 1 ? 's' : ''} hidden</span>
        </div>
      )}
      
      <ImageZoomDialog
        images={zoomImages}
        initialIndex={zoomIndex}
        open={zoomOpen}
        onOpenChange={setZoomOpen}
      />
    </div>
  );
}
