import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type Theme = 'dark' | 'light' | 'system';
export type TextSize = 'small' | 'medium' | 'large';
export type AccentColor = 'emerald' | 'blue' | 'purple' | 'orange' | 'pink' | 'cyan' | 'custom';
export type GoalPeriod = 'D' | 'W' | 'M' | 'Y';

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  background: string;
  winColor: string;
  lossColor: string;
  backgroundTint?: string;
}

interface Preferences {
  theme: Theme;
  textSize: TextSize;
  accentColor: AccentColor;
  goalPeriod: GoalPeriod;
  customColors: {
    primary: string;
    background: string;
    winColor: string;
    lossColor: string;
    backgroundTint: string;
  };
  presets: ColorPreset[];
  activePresetId: string | null;
  liquidGlassEnabled: boolean;
  folderColorPresets: string[];
}

const defaultPreset: ColorPreset = {
  id: 'default',
  name: 'Default',
  primary: '#22c55e',
  background: '#0a0a0a',
  winColor: '#22c55e',
  lossColor: '#ef4444',
  backgroundTint: '#22c55e',
};

const defaultPreferences: Preferences = {
  theme: 'light',
  textSize: 'medium',
  accentColor: 'emerald',
  goalPeriod: 'M',
  customColors: {
    primary: '#22c55e',
    background: '#0a0a0a',
    winColor: '#22c55e',
    lossColor: '#ef4444',
    backgroundTint: '#22c55e',
  },
  presets: [defaultPreset],
  activePresetId: 'default',
  liquidGlassEnabled: false,
  folderColorPresets: [],
};

const STORAGE_KEY = 'app-preferences';

const accentColors: Record<AccentColor, { hsl: string; name: string }> = {
  emerald: { hsl: '142 71% 45%', name: 'Emerald' },
  blue: { hsl: '217 91% 60%', name: 'Blue' },
  purple: { hsl: '262 83% 58%', name: 'Purple' },
  orange: { hsl: '25 95% 53%', name: 'Orange' },
  pink: { hsl: '330 81% 60%', name: 'Pink' },
  cyan: { hsl: '186 94% 41%', name: 'Cyan' },
  custom: { hsl: '142 71% 45%', name: 'Custom' },
};

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '142 71% 45%';

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

interface PreferencesContextValue {
  preferences: Preferences;
  setTheme: (theme: Theme) => void;
  setTextSize: (textSize: TextSize) => void;
  setAccentColor: (accentColor: AccentColor) => void;
  setGoalPeriod: (goalPeriod: GoalPeriod) => void;
  setCustomColor: (key: keyof Preferences['customColors'], value: string) => void;
  setLiquidGlassEnabled: (enabled: boolean) => void;
  createPreset: (name: string) => ColorPreset | null;
  deletePreset: (id: string) => void;
  applyPreset: (preset: ColorPreset) => void;
  addFolderColorPreset: (color: string) => void;
  removeFolderColorPreset: (color: string) => void;
  accentColors: typeof accentColors;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences;
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const presets = parsed.presets?.length 
          ? parsed.presets.map((p: ColorPreset) => 
              p.id === 'default' ? defaultPreset : p
            )
          : [defaultPreset];
        
        const customColors = parsed.activePresetId === 'default' 
          ? defaultPreferences.customColors 
          : (parsed.customColors || defaultPreferences.customColors);
        
        return { 
          ...defaultPreferences, 
          ...parsed,
          presets,
          customColors,
        };
      } catch {
        return defaultPreferences;
      }
    }
    return defaultPreferences;
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from database when user logs in
  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    const loadFromDb = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('theme, color_preset_id, custom_colors, saved_presets, liquid_glass_enabled')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        setIsLoaded(true);
        return;
      }

      const dbPreferences: Partial<Preferences> = {};
      
      if (data.theme) {
        dbPreferences.theme = data.theme as Theme;
      }
      
      if (data.color_preset_id) {
        dbPreferences.activePresetId = data.color_preset_id;
      }
      
      if (data.custom_colors && typeof data.custom_colors === 'object') {
        const cc = data.custom_colors as Record<string, string>;
        dbPreferences.customColors = {
          primary: cc.primary || defaultPreferences.customColors.primary,
          background: cc.background || defaultPreferences.customColors.background,
          winColor: cc.winColor || defaultPreferences.customColors.winColor,
          lossColor: cc.lossColor || defaultPreferences.customColors.lossColor,
          backgroundTint: cc.backgroundTint || defaultPreferences.customColors.backgroundTint,
        };
      }
      
      if (Array.isArray(data.saved_presets) && data.saved_presets.length > 0) {
        dbPreferences.presets = [defaultPreset, ...(data.saved_presets as unknown as ColorPreset[])];
      }
      
      if (typeof data.liquid_glass_enabled === 'boolean') {
        dbPreferences.liquidGlassEnabled = data.liquid_glass_enabled;
      }

      setPreferences(prev => ({ ...prev, ...dbPreferences }));
      setIsLoaded(true);
    };

    loadFromDb();
  }, [user]);

  // Save to database when preferences change (debounced)
  useEffect(() => {
    if (!user || !isLoaded) return;

    const timeoutId = setTimeout(async () => {
      const savedPresets = preferences.presets.filter(p => p.id !== 'default');
      
      await supabase
        .from('profiles')
        .update({
          theme: preferences.theme,
          color_preset_id: preferences.activePresetId,
          custom_colors: JSON.parse(JSON.stringify(preferences.customColors)),
          saved_presets: JSON.parse(JSON.stringify(savedPresets)),
          liquid_glass_enabled: preferences.liquidGlassEnabled,
        })
        .eq('user_id', user.id);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [user, preferences, isLoaded]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    
    const applyTheme = (isDark: boolean) => {
      root.classList.remove('dark', 'light');
      root.classList.add(isDark ? 'dark' : 'light');
    };
    
    if (preferences.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      applyTheme(preferences.theme === 'dark');
    }
  }, [preferences.theme]);

  // Apply liquid glass toggle
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.liquidGlassEnabled) {
      root.classList.remove('no-glass');
    } else {
      root.classList.add('no-glass');
    }
  }, [preferences.liquidGlassEnabled]);

  // Apply text size
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-small', 'text-size-medium', 'text-size-large');
    root.classList.add(`text-size-${preferences.textSize}`);
  }, [preferences.textSize]);

  // Apply accent color and custom colors
  useEffect(() => {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    const primaryHsl = hexToHsl(preferences.customColors.primary);
    const tintHsl = hexToHsl(preferences.customColors.backgroundTint);
    
    root.style.setProperty('--pnl-positive', hexToHsl(preferences.customColors.winColor));
    root.style.setProperty('--pnl-negative', hexToHsl(preferences.customColors.lossColor));
    root.style.setProperty('--accent-color', primaryHsl);
    
    const hueMatch = tintHsl.match(/^(\d+)/);
    const hue = hueMatch ? hueMatch[1] : '150';
    
    if (isDark) {
      root.style.setProperty('--background', `${hue} 10% 4%`);
      root.style.setProperty('--card', `${hue} 8% 7%`);
      root.style.setProperty('--popover', `${hue} 8% 7%`);
      root.style.setProperty('--secondary', `${hue} 6% 12%`);
      root.style.setProperty('--muted', `${hue} 6% 15%`);
      root.style.setProperty('--accent', `${hue} 6% 18%`);
      root.style.setProperty('--border', `${hue} 6% 15%`);
      root.style.setProperty('--input', `${hue} 6% 12%`);
      root.style.setProperty('--sidebar-background', `${hue} 8% 7%`);
      root.style.setProperty('--sidebar-accent', `${hue} 6% 15%`);
      root.style.setProperty('--sidebar-border', `${hue} 6% 15%`);
    } else {
      root.style.setProperty('--background', '0 0% 99%');
      root.style.setProperty('--card', '0 0% 100%');
      root.style.setProperty('--popover', '0 0% 100%');
      root.style.setProperty('--secondary', '0 0% 96%');
      root.style.setProperty('--muted', '0 0% 94%');
      root.style.setProperty('--accent', '0 0% 96%');
      root.style.setProperty('--border', '0 0% 90%');
      root.style.setProperty('--input', '0 0% 92%');
      root.style.setProperty('--sidebar-background', '0 0% 99%');
      root.style.setProperty('--sidebar-accent', '0 0% 94%');
      root.style.setProperty('--sidebar-border', '0 0% 90%');
    }
  }, [preferences.customColors, preferences.theme]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setTheme = useCallback((theme: Theme) => {
    setPreferences(prev => ({ ...prev, theme }));
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setPreferences(prev => ({ ...prev, textSize }));
  }, []);

  const setAccentColor = useCallback((accentColor: AccentColor) => {
    setPreferences(prev => ({ ...prev, accentColor }));
  }, []);

  const setGoalPeriod = useCallback((goalPeriod: GoalPeriod) => {
    setPreferences(prev => ({ ...prev, goalPeriod }));
  }, []);

  const setLiquidGlassEnabled = useCallback((enabled: boolean) => {
    setPreferences(prev => ({ ...prev, liquidGlassEnabled: enabled }));
  }, []);

  const setCustomColor = useCallback((key: keyof Preferences['customColors'], value: string) => {
    setPreferences(prev => ({
      ...prev,
      customColors: { ...prev.customColors, [key]: value },
    }));
  }, []);

  const createPreset = useCallback((name: string) => {
    let newPreset: ColorPreset | null = null;
    setPreferences(prev => {
      newPreset = {
        id: `preset-${Date.now()}`,
        name,
        ...prev.customColors,
      };
      return {
        ...prev,
        presets: [...prev.presets, newPreset],
        activePresetId: newPreset.id,
      };
    });
    return newPreset;
  }, []);

  const deletePreset = useCallback((id: string) => {
    if (id === 'default') return;
    setPreferences(prev => ({
      ...prev,
      presets: prev.presets.filter(p => p.id !== id),
      activePresetId: prev.activePresetId === id ? 'default' : prev.activePresetId,
    }));
  }, []);

  const applyPreset = useCallback((preset: ColorPreset) => {
    const colorsToApply = preset.id === 'default' ? defaultPreset : preset;
    setPreferences(prev => ({
      ...prev,
      customColors: {
        primary: colorsToApply.primary,
        background: colorsToApply.background,
        winColor: colorsToApply.winColor,
        lossColor: colorsToApply.lossColor,
        backgroundTint: colorsToApply.backgroundTint || colorsToApply.primary,
      },
      activePresetId: preset.id,
    }));
  }, []);

  const addFolderColorPreset = useCallback((color: string) => {
    setPreferences(prev => {
      if (prev.folderColorPresets.includes(color)) return prev;
      return {
        ...prev,
        folderColorPresets: [...prev.folderColorPresets, color].slice(-10),
      };
    });
  }, []);

  const removeFolderColorPreset = useCallback((color: string) => {
    setPreferences(prev => ({
      ...prev,
      folderColorPresets: prev.folderColorPresets.filter(c => c !== color),
    }));
  }, []);

  return (
    <PreferencesContext.Provider value={{
      preferences,
      setTheme,
      setTextSize,
      setAccentColor,
      setGoalPeriod,
      setCustomColor,
      setLiquidGlassEnabled,
      createPreset,
      deletePreset,
      applyPreset,
      addFolderColorPreset,
      removeFolderColorPreset,
      accentColors,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}

// Re-export types for backwards compatibility
export type { Preferences };
