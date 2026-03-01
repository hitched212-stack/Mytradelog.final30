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
        'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black',
        'transition-opacity duration-300',
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8">
        {/* Logo/Icon Container */}
        <div className="flex flex-col items-center gap-4">
          {/* Splash Icon */}
          <img
            src="/splash-icon.png"
            alt="MyTradeLog"
            className="h-16 w-auto object-contain dark:invert-0 invert"
          />

          {/* App Name */}
          <div className="text-center">
            <h1 className="text-lg sm:text-xl font-bold font-display tracking-tight text-foreground">
              MyTradeLog
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">Trading Journal</p>
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
