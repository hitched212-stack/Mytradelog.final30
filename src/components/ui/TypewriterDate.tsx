import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TypewriterDateProps {
  date: Date;
  formatString?: string;
  className?: string;
  interval?: number; // Interval between animations in ms
}

export function TypewriterDate({ 
  date, 
  formatString = 'EEEE, MMMM d, yyyy',
  className,
  interval = 10000 // Re-animate every 10 seconds
}: TypewriterDateProps) {
  const fullText = format(date, formatString);
  const [displayText, setDisplayText] = useState(fullText);
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = useCallback(() => {
    setIsAnimating(true);
    setDisplayText('');
    
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsAnimating(false);
      }
    }, 50); // 50ms per character

    return () => clearInterval(typeInterval);
  }, [fullText]);

  // Initial animation on mount
  useEffect(() => {
    const cleanup = animate();
    return cleanup;
  }, []);

  // Repeat animation at interval
  useEffect(() => {
    const repeatTimer = setInterval(() => {
      animate();
    }, interval);

    return () => clearInterval(repeatTimer);
  }, [animate, interval]);

  return (
    <span className={cn("inline-block", className)}>
      {displayText}
      {isAnimating && (
        <span className="inline-block w-[2px] h-[1em] bg-muted-foreground/50 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
