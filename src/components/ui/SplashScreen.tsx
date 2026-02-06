import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete?: () => void;
  minDuration?: number;
}

export function SplashScreen({ onComplete, minDuration = 1500 }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      if (onComplete) {
        // Give time for fade out animation
        setTimeout(onComplete, 300);
      }
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onComplete]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/20',
        'transition-opacity duration-300',
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      {/* Background blur effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pnl-positive/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo/Icon Container */}
        <div className="flex flex-col items-center gap-4">
          {/* Main Icon - Trading focused */}
          <div className="relative w-24 h-24">
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-pnl-positive/50 animate-spin"></div>

            {/* Icon background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/10 to-pnl-positive/10 backdrop-blur-sm"></div>

            {/* Chart icon */}
            <svg
              className="absolute inset-0 w-full h-full p-5 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>

          {/* App Name */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
              Trade
              <span className="bg-gradient-to-r from-primary to-pnl-positive bg-clip-text text-transparent">
                Path
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Trading Journal & Analytics</p>
          </div>
        </div>

        {/* Loading indicator */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>

        {/* Loading text */}
        <p className="text-xs text-muted-foreground/60 font-medium tracking-wider uppercase">Loading your trades...</p>
      </div>
    </div>
  );
}
