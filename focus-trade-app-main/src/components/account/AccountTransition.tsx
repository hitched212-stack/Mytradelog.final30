import { ReactNode, useRef, useEffect, useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { cn } from '@/lib/utils';

interface AccountTransitionProps {
  children: ReactNode;
  className?: string;
}

// Transition duration must match useAccount.tsx SWITCH_TRANSITION_DURATION
const TRANSITION_DURATION = 150;

/**
 * Wrapper component that provides smooth fade transition when switching accounts.
 * Uses a seamless crossfade effect with no flashes or glitches.
 * All account-dependent content should be wrapped in this component.
 * Respects reduced-motion accessibility preferences.
 * 
 * Simplified: Only dims during explicit account switches (isSwitching flag).
 * Does NOT block on trade sync to prevent stuck states.
 */
export function AccountTransition({ children, className }: AccountTransitionProps) {
  const { isSwitching } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);
  const [minHeight, setMinHeight] = useState<number | undefined>(undefined);

  // Lock height during transition to prevent layout jumps
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isSwitching) {
      // Capture current height before transition starts
      setMinHeight(container.offsetHeight);
    } else {
      // Reset after transition completes with a delay
      const timeout = setTimeout(() => {
        setMinHeight(undefined);
      }, TRANSITION_DURATION + 200);
      return () => clearTimeout(timeout);
    }
  }, [isSwitching]);

  // Use reduced opacity instead of 0 to prevent completely blank screen
  // This keeps content visible but dimmed during transition
  const transitionOpacity = isSwitching ? 0.3 : 1;

  return (
    <div
      ref={containerRef}
      className={cn(
        'will-change-[opacity] transition-opacity ease-out',
        className
      )}
      style={{
        opacity: transitionOpacity,
        transitionDuration: `${TRANSITION_DURATION}ms`,
        minHeight: minHeight,
      }}
    >
      {children}
    </div>
  );
}
