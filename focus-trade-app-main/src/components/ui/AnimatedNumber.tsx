import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAccount } from '@/hooks/useAccount';

interface AnimatedNumberProps {
  value: number;
  formatFn: (value: number) => string;
  className?: string;
  duration?: number;
}

/**
 * Animates number changes with a smooth count-up/down effect.
 * Animates when switching accounts (after transition completes) for visual polish.
 */
export function AnimatedNumber({ 
  value, 
  formatFn, 
  className,
  duration = 400 
}: AnimatedNumberProps) {
  const { isSwitching } = useAccount();
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousValueRef = useRef(value);
  const wasSwitchingRef = useRef(false);

  useEffect(() => {
    // Track when switching ends to trigger animation
    if (wasSwitchingRef.current && !isSwitching) {
      // Switching just ended - animate from old value to new value
      const startValue = displayValue;
      const endValue = value;
      const difference = endValue - startValue;

      // Only animate if there's a meaningful difference
      if (Math.abs(difference) >= 0.01) {
        startTimeRef.current = null;
        previousValueRef.current = value;

        const animate = (timestamp: number) => {
          if (startTimeRef.current === null) {
            startTimeRef.current = timestamp;
          }

          const elapsed = timestamp - startTimeRef.current;
          const progress = Math.min(elapsed / duration, 1);
          
          // Ease out cubic for smooth deceleration
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          const currentValue = startValue + difference * easeOut;
          setDisplayValue(currentValue);

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(animate);
          } else {
            setDisplayValue(endValue);
            animationRef.current = null;
          }
        };

        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        previousValueRef.current = value;
      }
    }
    
    wasSwitchingRef.current = isSwitching;
  }, [isSwitching, value, displayValue, duration]);

  useEffect(() => {
    // If currently switching, update display value immediately (no animation)
    if (isSwitching) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      // Keep showing old value during switch for smooth crossfade
      return;
    }

    // Normal value change (not from switching) - animate it
    if (previousValueRef.current !== value && !wasSwitchingRef.current) {
      const startValue = displayValue;
      const endValue = value;
      const difference = endValue - startValue;

      // For very small changes, update immediately
      if (Math.abs(difference) < 0.01) {
        setDisplayValue(value);
        previousValueRef.current = value;
        return;
      }

      startTimeRef.current = null;
      previousValueRef.current = value;

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + difference * easeOut;
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }
  }, [value, duration, isSwitching, displayValue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <span className={cn('tabular-nums', className)}>
      {formatFn(displayValue)}
    </span>
  );
}