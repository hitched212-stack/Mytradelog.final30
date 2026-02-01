import { create } from 'zustand';
import { Trade } from '@/types/trade';
import { Currency, PnlGoals } from '@/types/trade';

interface Settings {
  currency: Currency;
  goals: PnlGoals;
  accountBalance: number;
  username: string;
  balanceHidden: boolean;
  avatarUrl: string | null;
  hasLoggedInBefore: boolean;
}

interface DataState {
  // Trades
  trades: Trade[];
  tradesLoaded: boolean;
  currentAccountId: string | null;
  isTransitioning: boolean;
  previousTrades: Trade[]; // Cache for smooth transitions
  previousStartingBalance: number; // Cache previous account's starting balance
  isHydrating: boolean; // True when fresh data is being loaded after auth change
  setTrades: (trades: Trade[]) => void;
  setTradesLoaded: (loaded: boolean) => void;
  setCurrentAccountId: (accountId: string | null) => void;
  setIsTransitioning: (transitioning: boolean) => void;
  setIsHydrating: (hydrating: boolean) => void;
  setPreviousStartingBalance: (balance: number) => void;
  
  // Settings
  settings: Settings;
  settingsLoaded: boolean;
  setSettings: (settings: Settings) => void;
  setSettingsLoaded: (loaded: boolean) => void;
  
  // Reset
  resetAll: () => void;
}

const defaultSettings: Settings = {
  currency: 'USD',
  goals: {
    daily: 500,
    weekly: 2500,
    monthly: 10000,
    yearly: 120000,
  },
  accountBalance: 0,
  username: '',
  balanceHidden: false,
  avatarUrl: null,
  hasLoggedInBefore: false,
};

export const useDataStore = create<DataState>((set, get) => ({
  // Trades
  trades: [],
  tradesLoaded: false,
  currentAccountId: null,
  isTransitioning: false,
  previousTrades: [],
  previousStartingBalance: 0,
  isHydrating: false, // Start as false - only set true when explicitly resetting
  setTrades: (trades) => {
    const currentTrades = get().trades;
    // Only cache previous trades if we had data (prevents caching empty arrays)
    const previousTrades = currentTrades.length > 0 ? currentTrades : get().previousTrades;
    set({ trades, tradesLoaded: true, previousTrades });
  },
  setTradesLoaded: (loaded) => set({ tradesLoaded: loaded }),
  setCurrentAccountId: (accountId) => set({ currentAccountId: accountId }),
  setIsTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  setIsHydrating: (hydrating) => set({ isHydrating: hydrating }),
  setPreviousStartingBalance: (balance) => set({ previousStartingBalance: balance }),
  
  // Settings
  settings: defaultSettings,
  settingsLoaded: false,
  setSettings: (settings) => set({ settings, settingsLoaded: true }),
  setSettingsLoaded: (loaded) => set({ settingsLoaded: loaded }),
  
  // Reset - called on sign out/sign in to prevent stale data
  resetAll: () => set({
    trades: [],
    tradesLoaded: false,
    currentAccountId: null,
    isTransitioning: false,
    previousTrades: [],
    previousStartingBalance: 0,
    isHydrating: true, // Mark as hydrating when reset - new data will be loaded
    settings: defaultSettings,
    settingsLoaded: false,
  }),
}));
