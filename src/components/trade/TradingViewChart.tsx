import { useEffect, useRef, memo, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, ColorType } from 'lightweight-charts';
import { cn } from '@/lib/utils';

interface TradingViewChartProps {
  symbol?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  direction?: 'long' | 'short';
  className?: string;
}

// Generate mock candlestick data
const generateMockData = (basePrice: number = 1.0850, numCandles: number = 100): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice;
  const now = new Date();
  
  for (let i = numCandles; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly candles
    const volatility = 0.002;
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
    
    data.push({
      time: (time.getTime() / 1000) as any,
      open,
      high,
      low,
      close,
    });
    
    currentPrice = close;
  }
  
  return data;
};

export const TradingViewChart = memo(function TradingViewChart({
  symbol = 'EURUSD',
  entryPrice,
  stopLoss,
  takeProfit,
  direction = 'long',
  className,
}: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          style: 2,
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.2)',
          style: 2,
        },
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Generate and set data based on entry price
    const basePrice = entryPrice || 1.0850;
    const data = generateMockData(basePrice);
    candlestickSeries.setData(data);

    // Add price lines for entry, SL, TP
    if (entryPrice) {
      candlestickSeries.createPriceLine({
        price: entryPrice,
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 0,
        axisLabelVisible: true,
        title: 'Entry',
      });
    }

    if (stopLoss && entryPrice) {
      const slPrice = direction === 'long' 
        ? entryPrice - (stopLoss * 0.0001)
        : entryPrice + (stopLoss * 0.0001);
      
      candlestickSeries.createPriceLine({
        price: slPrice,
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'SL',
      });
    }

    if (takeProfit && entryPrice) {
      const tpPrice = direction === 'long'
        ? entryPrice + (takeProfit * 0.0001)
        : entryPrice - (takeProfit * 0.0001);
      
      candlestickSeries.createPriceLine({
        price: tpPrice,
        color: '#22c55e',
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: 'TP',
      });
    }

    chart.timeScale().fitContent();
    setIsLoading(false);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [entryPrice, stopLoss, takeProfit, direction]);

  return (
    <div className={cn('relative rounded-lg overflow-hidden bg-background/50 border border-border', className)}>
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        <span className="text-xs font-medium text-foreground/70 bg-background/80 px-2 py-1 rounded">
          {symbol}
        </span>
        <span className="text-xs text-muted-foreground">1H</span>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
});
