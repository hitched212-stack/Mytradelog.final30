import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { DEFAULT_TIMEFRAMES } from '@/lib/timeframes';

interface TradingPreferences {
  tradingRules: string[];
  selectedTimeframes: string[];
}

const defaultPreferences: TradingPreferences = {
  tradingRules: [],
  selectedTimeframes: DEFAULT_TIMEFRAMES,
};

export function useTradingPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferencesState] = useState<TradingPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch preferences from profile
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('trading_rules, selected_timeframes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferencesState({
          tradingRules: (data.trading_rules as string[]) || [],
          selectedTimeframes: (data.selected_timeframes as string[]) || DEFAULT_TIMEFRAMES,
        });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error fetching trading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Reset loaded state whenever user changes
    setIsLoaded(false);
    if (!user) {
      return;
    }
    if (!isLoaded && user) {
      fetchPreferences();
    }
  }, [user, isLoaded, fetchPreferences]);

  // Update trading rules
  const setTradingRules = useCallback(async (tradingRules: string[]) => {
    if (!user) return;

    setPreferencesState(prev => ({ ...prev, tradingRules }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ trading_rules: tradingRules })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating trading rules:', error);
      toast.error('Failed to save trading rules');
    }
  }, [user]);

  // Add a trading rule
  const addTradingRule = useCallback(async (rule: string) => {
    const updatedRules = [...preferences.tradingRules, rule];
    await setTradingRules(updatedRules);
  }, [preferences.tradingRules, setTradingRules]);

  // Update a trading rule
  const updateTradingRule = useCallback(async (index: number, newRule: string) => {
    const updatedRules = preferences.tradingRules.map((rule, i) => 
      i === index ? newRule : rule
    );
    await setTradingRules(updatedRules);
  }, [preferences.tradingRules, setTradingRules]);

  // Remove a trading rule
  const removeTradingRule = useCallback(async (index: number) => {
    const updatedRules = preferences.tradingRules.filter((_, i) => i !== index);
    await setTradingRules(updatedRules);
  }, [preferences.tradingRules, setTradingRules]);

  // Update selected timeframes
  const setSelectedTimeframes = useCallback(async (selectedTimeframes: string[]) => {
    if (!user) return;

    setPreferencesState(prev => ({ ...prev, selectedTimeframes }));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ selected_timeframes: selectedTimeframes })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating timeframes:', error);
      toast.error('Failed to save timeframes');
    }
  }, [user]);

  // Toggle a single timeframe
  const toggleTimeframe = useCallback(async (value: string) => {
    setPreferencesState(prev => {
      const isCurrentlySelected = prev.selectedTimeframes.includes(value);
      const updated = isCurrentlySelected
        ? prev.selectedTimeframes.filter(tf => tf !== value)
        : [...prev.selectedTimeframes, value];
      
      // Also update DB (fire and forget to avoid blocking UI)
      if (user) {
        supabase
          .from('profiles')
          .update({ selected_timeframes: updated })
          .eq('user_id', user.id)
          .catch(error => {
            console.error('Error updating timeframes:', error);
            toast.error('Failed to save timeframes');
          });
      }
      
      return { ...prev, selectedTimeframes: updated };
    });
  }, [user]);

  return {
    tradingRules: preferences.tradingRules,
    selectedTimeframes: preferences.selectedTimeframes,
    isLoading,
    setTradingRules,
    addTradingRule,
    updateTradingRule,
    removeTradingRule,
    setSelectedTimeframes,
    toggleTimeframe,
    refetch: fetchPreferences,
  };
}
