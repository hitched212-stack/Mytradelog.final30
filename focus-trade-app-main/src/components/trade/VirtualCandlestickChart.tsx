import { useMemo } from 'react';
import { Trade } from '@/types/trade';
import { cn } from '@/lib/utils';
interface VirtualCandlestickChartProps {
  trade: Trade;
  className?: string;
  compact?: boolean;
}
export function VirtualCandlestickChart({
  trade,
  className,
  compact = false
}: VirtualCandlestickChartProps) {
  const isProfit = trade.pnlAmount >= 0;
  const isLong = trade.direction === 'long';

  // Generate virtual candles based on trade data
  const candles = useMemo(() => {
    const entry = trade.entryPrice || 100;
    const sl = trade.stopLoss || 10;
    const tp = trade.takeProfit || 20;

    // Calculate price levels
    const slPrice = isLong ? entry - sl : entry + sl;
    const tpPrice = isLong ? entry + tp : entry - tp;
    const exitPrice = isProfit ? isLong ? entry + tp * 0.8 : entry - tp * 0.8 : isLong ? entry - sl * 0.6 : entry + sl * 0.6;

    // Generate 8-12 candles leading up to and including the trade
    const candleCount = compact ? 6 : 10;
    const generatedCandles = [];
    const priceRange = Math.max(sl, tp) * 2;
    const basePrice = entry - priceRange * 0.3;
    for (let i = 0; i < candleCount; i++) {
      const progress = i / candleCount;
      const volatility = priceRange * 0.15;

      // Create a trend toward entry
      const trendPrice = basePrice + (entry - basePrice) * progress;
      const randomOffset = (Math.sin(i * 2.5) + Math.cos(i * 1.8)) * volatility * 0.5;
      const open = trendPrice + randomOffset;
      const close = trendPrice + randomOffset + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      generatedCandles.push({
        open,
        close,
        high,
        low,
        isGreen: close > open,
        isEntry: i === candleCount - 3,
        isExit: i === candleCount - 1
      });
    }
    const volatilityVal = priceRange * 0.15;

    // Mark entry candle
    if (generatedCandles.length >= 3) {
      const entryCandle = generatedCandles[candleCount - 3];
      entryCandle.open = entry - (isLong ? volatilityVal * 0.2 : -volatilityVal * 0.2);
      entryCandle.close = entry;
      entryCandle.high = Math.max(entryCandle.open, entryCandle.close) + volatilityVal * 0.3;
      entryCandle.low = Math.min(entryCandle.open, entryCandle.close) - volatilityVal * 0.3;
      entryCandle.isGreen = isLong;
    }

    // Exit candle
    const exitCandle = generatedCandles[candleCount - 1];
    exitCandle.open = entry + (isLong ? isProfit ? tp * 0.4 : -sl * 0.3 : isProfit ? -tp * 0.4 : sl * 0.3);
    exitCandle.close = exitPrice;
    exitCandle.high = Math.max(exitCandle.open, exitCandle.close) + priceRange * 0.05;
    exitCandle.low = Math.min(exitCandle.open, exitCandle.close) - priceRange * 0.05;
    exitCandle.isGreen = isProfit;
    return {
      candles: generatedCandles,
      entry,
      slPrice,
      tpPrice,
      exitPrice,
      minPrice: Math.min(...generatedCandles.map(c => c.low), slPrice) - priceRange * 0.1,
      maxPrice: Math.max(...generatedCandles.map(c => c.high), tpPrice) + priceRange * 0.1
    };
  }, [trade, isLong, isProfit]);
  const chartHeight = compact ? 60 : 100;
  const chartWidth = compact ? 120 : 180;
  const candleWidth = chartWidth / candles.candles.length - 2;
  const priceToY = (price: number) => {
    const range = candles.maxPrice - candles.minPrice;
    return chartHeight - (price - candles.minPrice) / range * chartHeight;
  };
  return <div className={cn("relative", className)}>
      
    </div>;
}