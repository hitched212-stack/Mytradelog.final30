import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Theme } from '@/hooks/usePreferences';

const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'system', icon: Monitor, label: 'System preference' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
];

interface ThemeSwitchProps {
  value: Theme;
  onChange: (value: Theme) => void;
}

export function ThemeSwitch({ value, onChange }: ThemeSwitchProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {themes.map((theme) => {
        const Icon = theme.icon;
        const isActive = value === theme.value;
        
        return (
          <button
            key={theme.value}
            onClick={() => onChange(theme.value)}
            className={cn(
              "relative rounded-2xl border-2 overflow-hidden transition-all duration-200 group",
              isActive
                ? "border-foreground"
                : "border-border/50 hover:border-border"
            )}
          >
            {/* Preview Window */}
            <div className={cn(
              "h-24 relative flex flex-col",
              theme.value === 'light' ? 'bg-white' : theme.value === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gradient-to-b from-white to-[#1a1a1a]'
            )}>
              {/* Window Header */}
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-2 border-b",
                theme.value === 'light' ? 'bg-[#f5f5f5] border-[#e0e0e0]' : theme.value === 'dark' ? 'bg-[#2a2a2a] border-[#3a3a3a]' : 'bg-[#f5f5f5] border-[#e0e0e0]'
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  theme.value === 'light' ? 'bg-[#ff5f57]' : theme.value === 'dark' ? 'bg-[#ff5f57]' : 'bg-[#ff5f57]'
                )} />
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  theme.value === 'light' ? 'bg-[#ffbd2e]' : theme.value === 'dark' ? 'bg-[#ffbd2e]' : 'bg-[#ffbd2e]'
                )} />
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  theme.value === 'light' ? 'bg-[#28c940]' : theme.value === 'dark' ? 'bg-[#28c940]' : 'bg-[#28c940]'
                )} />
              </div>

              {/* Content Lines */}
              <div className="flex-1 flex flex-col justify-center px-3 py-2 gap-1.5">
                <div className={cn(
                  "h-1.5 rounded",
                  theme.value === 'light' ? 'bg-[#d0d0d0]' : theme.value === 'dark' ? 'bg-[#404040]' : 'bg-[#d0d0d0]'
                )} />
                <div className={cn(
                  "h-1.5 rounded w-3/4",
                  theme.value === 'light' ? 'bg-[#d0d0d0]' : theme.value === 'dark' ? 'bg-[#404040]' : 'bg-[#d0d0d0]'
                )} />
              </div>
            </div>

            {/* Label */}
            <div className="px-3 py-2.5 bg-card/50 text-center">
              <p className="text-sm font-medium text-foreground">{theme.label}</p>
            </div>

            {/* Active Indicator */}
            {isActive && (
              <div className="absolute inset-0 rounded-2xl ring-2 ring-foreground pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}
