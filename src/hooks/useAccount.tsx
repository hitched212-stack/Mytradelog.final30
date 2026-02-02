import { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDataStore } from '@/store/dataStore';

export type AccountRole = 'owner' | 'admin' | 'member';
export type AccountType = 'prop_firm' | 'personal' | 'funded' | 'demo';
export type AccountStatus = 'active' | 'archived';

export interface Account {
  id: string;
  name: string;
  role: AccountRole;
  type: AccountType;
  broker_name: string | null;
  currency: string;
  starting_balance: number;
  status: AccountStatus;
  created_at: string;
}

interface AccountContextType {
  accounts: Account[];
  activeAccount: Account | null;
  loading: boolean;
  isSwitching: boolean;
  setActiveAccount: (account: Account) => void;
  refreshAccounts: () => Promise<void>;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

const SWITCH_TRANSITION_DURATION = 150; // ms - quick fade out (reduced for snappier feel)
const DATA_SETTLE_DELAY = 50; // ms - minimal time for React to process updates

export function AccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { setIsTransitioning, setPreviousStartingBalance } = useDataStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccountState] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);
  const switchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist selected account to database
  const persistSelectedAccount = useCallback(async (accountId: string) => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ selected_account_id: accountId })
        .eq('user_id', user.id);
    } catch (error) {
      // Silent failure - selection will be restored on next successful load
      if (import.meta.env.DEV) {
        console.error('Error persisting selected account:', error);
      }
    }
  }, [user]);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setActiveAccountState(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch accounts and user's selected account in parallel
      const [accountsResult, profileResult] = await Promise.all([
        supabase
          .from('account_users')
          .select(`
            account_id,
            role,
            accounts!inner (
              id,
              name,
              type,
              broker_name,
              currency,
              starting_balance,
              status,
              created_at
            )
          `)
          .eq('user_id', user.id),
        supabase
          .from('profiles')
          .select('selected_account_id')
          .eq('user_id', user.id)
          .maybeSingle()
      ]);

      if (accountsResult.error) throw accountsResult.error;

      const userAccounts: Account[] = (accountsResult.data || []).map((item: any) => ({
        id: item.accounts.id,
        name: item.accounts.name,
        role: item.role as AccountRole,
        type: (item.accounts.type || 'personal') as AccountType,
        broker_name: item.accounts.broker_name,
        currency: item.accounts.currency || 'USD',
        starting_balance: item.accounts.starting_balance || 0,
        status: (item.accounts.status || 'active') as AccountStatus,
        created_at: item.accounts.created_at,
      }));

      setAccounts(userAccounts);

      // Restore active account from database
      const savedAccountId = profileResult.data?.selected_account_id;
      const savedAccount = savedAccountId 
        ? userAccounts.find(a => a.id === savedAccountId)
        : null;
      
      if (savedAccount) {
        setActiveAccountState(savedAccount);
      } else if (userAccounts.length > 0) {
        // Use first account as default and persist it
        setActiveAccountState(userAccounts[0]);
        persistSelectedAccount(userAccounts[0].id);
      }
    } catch (error) {
      // Silent failure in production - errors are handled via UI state
      if (import.meta.env.DEV) {
        console.error('Error fetching accounts:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [user, persistSelectedAccount]);

  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;
    
    // Detect user change - reset state immediately before fetching
    if (currentUserId !== previousUserId) {
      // Clear previous user's data immediately
      setAccounts([]);
      setActiveAccountState(null);
      setLoading(true);
      previousUserIdRef.current = currentUserId;
    }
    
    // Fetch accounts for current user (or clear if no user)
    fetchAccounts();
  }, [user?.id, fetchAccounts]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  const setActiveAccount = useCallback((account: Account) => {
    // Don't switch if it's the same account
    if (activeAccount?.id === account.id) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Instant switch for reduced motion
      setActiveAccountState(account);
      persistSelectedAccount(account.id);
    } else {
      // Cache the current starting balance before switching
      if (activeAccount) {
        setPreviousStartingBalance(activeAccount.starting_balance);
      }
      
      // Start transition - notify data store to keep previous data visible
      setIsSwitching(true);
      setIsTransitioning(true);
      
      // Clear any existing timeouts
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
      if (settleTimeoutRef.current) {
        clearTimeout(settleTimeoutRef.current);
      }
      
      // Wait for fade-out to fully complete before updating data
      switchTimeoutRef.current = setTimeout(() => {
        // Update state while content is hidden
        setActiveAccountState(account);
        persistSelectedAccount(account.id);
        
        // Wait for React to fully process the state update and for new data to render
        // This delay is crucial - it ensures new content is fully ready before fade-in
        settleTimeoutRef.current = setTimeout(() => {
          setIsSwitching(false);
          setIsTransitioning(false);
        }, DATA_SETTLE_DELAY);
      }, SWITCH_TRANSITION_DURATION);
    }
  }, [activeAccount?.id, setIsTransitioning, persistSelectedAccount]);

  const refreshAccounts = useCallback(async () => {
    await fetchAccounts();
  }, [fetchAccounts]);

  return (
    <AccountContext.Provider value={{ 
      accounts, 
      activeAccount, 
      loading,
      isSwitching,
      setActiveAccount,
      refreshAccounts 
    }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
