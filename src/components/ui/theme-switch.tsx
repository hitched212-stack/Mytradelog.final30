import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '@/hooks/usePreferences';
import { useRef, useState, useLayoutEffect } from 'react';

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
];

interface ThemeSwitchProps {
  value: Theme;
  onChange: (value: Theme) => void;
}

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });

  useLayoutEffect(() => {
    const activeIndex = themes.findIndex((t) => t.value === value);
    const activeButton = buttonRefs.current[activeIndex];
    const container = containerRef.current;

    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        width: buttonRect.width,
        left: buttonRect.left - containerRect.left,
      });
    }
  }, [value]);

  return (
    <div 
      ref={containerRef}
      className="relative inline-flex items-center bg-muted/50 dark:bg-secondary rounded-full p-1 border border-border"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-full bg-background border border-border shadow-sm transition-all duration-300 ease-out"
        style={{
          width: indicatorStyle.width,
          left: indicatorStyle.left,
        }}
      />
      
      {themes.map((theme, index) => {
        const Icon = theme.icon;
        const isActive = value === theme.value;
        
        return (
          <button
            key={theme.value}
            ref={(el) => { buttonRefs.current[index] = el; }}
            onClick={() => onChange(theme.value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground/80"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
            <span className="hidden sm:inline">{theme.label}</span>
          </button>
        );
      })}
    </div>
  );
}
