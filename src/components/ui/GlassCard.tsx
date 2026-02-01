import { cn } from '@/lib/utils';
import { forwardRef, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  highlighted?: boolean;
  highlightColor?: 'positive' | 'negative';
  interactive?: boolean;
}

/**
 * A theme-aware card component that uses glass styling in dark mode
 * and solid backgrounds in light mode or when glass is disabled.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, highlighted, highlightColor, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles - theme aware
          "rounded-2xl border bg-card transition-all duration-300 relative overflow-hidden group",
          // Glass effect - theme aware with better light mode visibility
          "dark:bg-card/80 dark:border-border/50 dark:backdrop-blur-xl",
          // Light mode - solid card with subtle glass
          "bg-card/95 border-border/50 backdrop-blur-xl",
          // Interactive hover
          interactive && "cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30",
          // Highlighted states
          highlighted && highlightColor === 'positive' && "border-pnl-positive/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]",
          highlighted && highlightColor === 'negative' && "border-pnl-negative/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]",
          className
        )}
        {...props}
      >
        {/* Glass highlight effect - only visible on hover, theme-aware opacity */}
        <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] dark:from-foreground/[0.08] via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Content */}
        <div className="relative">
          {children}
        </div>
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';