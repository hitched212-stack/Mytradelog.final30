import { useState, useEffect, useCallback, useRef } from 'react';
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
  const lastUserIdRef = useRef<string | null>(null);

  // Fetch preferences from profile
  const fetchPreferences = useCallback(async () => {
    if (!user) {
      console.log('No user, skipping fetch');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching preferences for user:', user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('trading_rules, selected_timeframes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const savedTimeframes = (data.selected_timeframes as string[]) || [];
        console.log('Fetched timeframes from DB:', savedTimeframes);
        setPreferencesState({
          tradingRules: (data.trading_rules as string[]) || [],
          selectedTimeframes: savedTimeframes.length > 0 ? savedTimeframes : DEFAULT_TIMEFRAMES,
        });
      } else {
        // No profile data yet, use defaults
        console.log('No profile data, using defaults');
        setPreferencesState({
          tradingRules: [],
          selectedTimeframes: DEFAULT_TIMEFRAMES,
        });
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Error fetching trading preferences:', error);
      setIsLoaded(true); // Set loaded even on error to prevent infinite retries
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (lastUserIdRef.current !== currentUserId) {
      lastUserIdRef.current = currentUserId;
      setIsLoaded(false);
    }

    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!isLoaded) {
      fetchPreferences();
    }
  }, [user?.id, isLoaded, fetchPreferences]);

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
  const toggleTimeframe = useCallback((value: string) => {
    const isCurrentlySelected = preferences.selectedTimeframes.includes(value);
    const updated = isCurrentlySelected
      ? preferences.selectedTimeframes.filter(tf => tf !== value)
      : [...preferences.selectedTimeframes, value];
    
    // Update local state immediately
    setPreferencesState(prev => ({ ...prev, selectedTimeframes: updated }));
    
    // Update DB in background
    if (user && user.id) {
      supabase
        .from('profiles')
        .update({ selected_timeframes: updated })
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error updating timeframes:', error);
            toast.error('Failed to save timeframes');
          } else {
            console.log('Timeframes saved successfully:', updated);
          }
        })
        .catch(error => {
          console.error('Unexpected error updating timeframes:', error);
          toast.error('Failed to save timeframes');
        });
    } else {
      console.warn('Cannot update timeframes: user not found', user);
    }
  }, [preferences.selectedTimeframes, user]);

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
