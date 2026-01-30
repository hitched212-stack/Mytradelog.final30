import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: 'monthly' | 'annual';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSubscription(data as Subscription | null);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if subscription is active
  const isActive = useCallback(() => {
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    
    // Check if subscription hasn't expired
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    return periodEnd > now;
  }, [subscription]);

  // Get formatted renewal date
  const getRenewalDate = useCallback(() => {
    if (!subscription) return null;
    return new Date(subscription.current_period_end).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [subscription]);

  // Get plan display name
  const getPlanName = useCallback(() => {
    if (!subscription) return null;
    return subscription.plan_type === 'annual' ? 'Annual Pro' : 'Monthly Pro';
  }, [subscription]);

  // Get monthly price based on plan
  const getMonthlyPrice = useCallback(() => {
    if (!subscription) return null;
    return subscription.plan_type === 'annual' ? '$6.58' : '$9.99';
  }, [subscription]);

  return {
    subscription,
    loading,
    isActive: isActive(),
    renewalDate: getRenewalDate(),
    planName: getPlanName(),
    monthlyPrice: getMonthlyPrice(),
    refetch: fetchSubscription,
  };
}
