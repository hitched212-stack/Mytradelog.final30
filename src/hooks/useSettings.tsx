import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Currency, PnlGoals } from '@/types/trade';
import { useDataStore } from '@/store/dataStore';
import { toast } from 'sonner';

export function useSettings() {
  const { user } = useAuth();
  const { settings, settingsLoaded, setSettings } = useDataStore();

  // Fetch settings from profile - optimized with minimal query
  const fetchSettings = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('currency,account_balance,daily_goal,weekly_goal,monthly_goal,yearly_goal,username,balance_hidden,avatar_url,has_logged_in_before')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid errors when profile doesn't exist yet

      if (error) throw error;

      if (data) {
        const isFirstLogin = !data.has_logged_in_before;
        
        setSettings({
          currency: (data.currency as Currency) || 'USD',
          accountBalance: Number(data.account_balance) || 0,
          username: data.username || '',
          balanceHidden: data.balance_hidden || false,
          avatarUrl: data.avatar_url || null,
          hasLoggedInBefore: data.has_logged_in_before || false,
          goals: {
            daily: Number(data.daily_goal) || 500,
            weekly: Number(data.weekly_goal) || 2500,
            monthly: Number(data.monthly_goal) || 10000,
            yearly: Number(data.yearly_goal) || 120000,
          },
        });
        
        // Mark as logged in if this is first login (fire and forget - non-blocking)
        if (isFirstLogin) {
          supabase
            .from('profiles')
            .update({ has_logged_in_before: true })
            .eq('user_id', user.id)
            .then(() => {});
        }
      } else {
        // Profile doesn't exist yet, use defaults
        setSettings({
          currency: 'USD',
          accountBalance: 0,
          username: '',
          balanceHidden: false,
          avatarUrl: null,
          hasLoggedInBefore: false,
          goals: {
            daily: 500,
            weekly: 2500,
            monthly: 10000,
            yearly: 120000,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Set defaults on error so UI doesn't hang
      setSettings({
        currency: 'USD',
        accountBalance: 0,
        username: '',
        balanceHidden: false,
        avatarUrl: null,
        hasLoggedInBefore: false,
        goals: {
          daily: 500,
          weekly: 2500,
          monthly: 10000,
          yearly: 120000,
        },
      });
    }
  }, [user, setSettings]);

  useEffect(() => {
    if (!settingsLoaded && user) {
      fetchSettings();
    }
  }, [settingsLoaded, user, fetchSettings]);

  // Update currency
  const setCurrency = useCallback(async (currency: Currency) => {
    if (!user) return;

    setSettings({ ...settings, currency });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ currency })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error('Failed to save currency');
    }
  }, [user, settings, setSettings]);

  // Update account balance
  const setAccountBalance = useCallback(async (accountBalance: number) => {
    if (!user) return;

    setSettings({ ...settings, accountBalance });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_balance: accountBalance })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating account balance:', error);
      toast.error('Failed to save account balance');
    }
  }, [user, settings, setSettings]);

  // Update a single goal
  const updateGoal = useCallback(async (key: keyof PnlGoals, value: number) => {
    if (!user) return;

    setSettings({
      ...settings,
      goals: { ...settings.goals, [key]: value },
    });

    try {
      const columnMap: Record<keyof PnlGoals, string> = {
        daily: 'daily_goal',
        weekly: 'weekly_goal',
        monthly: 'monthly_goal',
        yearly: 'yearly_goal',
      };

      const { error } = await supabase
        .from('profiles')
        .update({ [columnMap[key]]: value })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to save goal');
    }
  }, [user, settings, setSettings]);

  // Set all goals at once
  const setGoals = useCallback(async (goals: PnlGoals) => {
    if (!user) return;

    try {
      // Update database first
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_goal: goals.daily,
          weekly_goal: goals.weekly,
          monthly_goal: goals.monthly,
          yearly_goal: goals.yearly,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state after successful DB update
      const currentSettings = useDataStore.getState().settings;
      setSettings({ ...currentSettings, goals });
      
      console.log('Goals saved successfully:', goals);
    } catch (error) {
      console.error('Error updating goals:', error);
      toast.error('Failed to save goals');
    }
  }, [user, setSettings]);

  // Update username
  const setUsername = useCallback(async (username: string) => {
    if (!user) return;

    try {
      // Update database first
      const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state after successful DB update
      const currentSettings = useDataStore.getState().settings;
      setSettings({ ...currentSettings, username });
      
      console.log('Username saved successfully:', username);
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error('Failed to save username');
    }
  }, [user, setSettings]);

  // Update balance hidden preference
  const setBalanceHidden = useCallback(async (balanceHidden: boolean) => {
    if (!user) return;

    setSettings({ ...settings, balanceHidden });

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance_hidden: balanceHidden })
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating balance visibility:', error);
      toast.error('Failed to save preference');
    }
  }, [user, settings, setSettings]);

  return {
    settings,
    isLoading: !settingsLoaded,
    setCurrency,
    setAccountBalance,
    setUsername,
    setBalanceHidden,
    updateGoal,
    setGoals,
    refetch: fetchSettings,
  };
}
