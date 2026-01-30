import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Trade, AppSettings, Currency, PnlGoals } from '@/types/trade';

interface TradeStore {
  trades: Trade[];
  settings: AppSettings;
  
  // Trade actions
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrade: (id: string, trade: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
  duplicateTrade: (id: string) => void;
  getTrade: (id: string) => Trade | undefined;
  
  // Settings actions
  setCurrency: (currency: Currency) => void;
  setGoals: (goals: PnlGoals) => void;
  updateGoal: (key: keyof PnlGoals, value: number) => void;
  setAccountBalance: (balance: number) => void;
  
  // Computed
  getTradesByDate: (date: string) => Trade[];
  getDailyPnl: (date: string) => number;
  getWeeklyPnl: (startDate: string) => number;
  getMonthlyPnl: (year: number, month: number) => number;
  getYearlyPnl: (year: number) => number;
  getTotalPnl: () => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      settings: {
        currency: 'USD',
        goals: {
          daily: 500,
          weekly: 2500,
          monthly: 10000,
          yearly: 120000,
        },
        accountBalance: 0,
      },

      addTrade: (tradeData) => {
        const now = new Date().toISOString();
        const newTrade: Trade = {
          ...tradeData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          trades: [newTrade, ...state.trades],
        }));
      },

      updateTrade: (id, updates) => {
        set((state) => ({
          trades: state.trades.map((trade) =>
            trade.id === id
              ? { ...trade, ...updates, updatedAt: new Date().toISOString() }
              : trade
          ),
        }));
      },

      deleteTrade: (id) => {
        set((state) => ({
          trades: state.trades.filter((trade) => trade.id !== id),
        }));
      },

      duplicateTrade: (id) => {
        const trade = get().getTrade(id);
        if (trade) {
          const now = new Date().toISOString();
          const newTrade: Trade = {
            ...trade,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
          };
          set((state) => ({
            trades: [newTrade, ...state.trades],
          }));
        }
      },

      getTrade: (id) => {
        return get().trades.find((trade) => trade.id === id);
      },

      setCurrency: (currency) => {
        set((state) => ({
          settings: { ...state.settings, currency },
        }));
      },

      setGoals: (goals) => {
        set((state) => ({
          settings: { ...state.settings, goals },
        }));
      },

      updateGoal: (key, value) => {
        set((state) => ({
          settings: {
            ...state.settings,
            goals: { ...state.settings.goals, [key]: value },
          },
        }));
      },

      setAccountBalance: (balance) => {
        set((state) => ({
          settings: { ...state.settings, accountBalance: balance },
        }));
      },

      getTradesByDate: (date) => {
        return get().trades.filter((trade) => trade.date === date);
      },

      getDailyPnl: (date) => {
        return get()
          .getTradesByDate(date)
          .filter((trade) => !trade.isPaperTrade && !trade.noTradeTaken)
          .reduce((sum, trade) => sum + trade.pnlAmount, 0);
      },

      getWeeklyPnl: (startDate) => {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        
        return get().trades
          .filter((trade) => {
            if (trade.isPaperTrade || trade.noTradeTaken) return false;
            const tradeDate = new Date(trade.date);
            return tradeDate >= start && tradeDate < end;
          })
          .reduce((sum, trade) => sum + trade.pnlAmount, 0);
      },

      getMonthlyPnl: (year, month) => {
        return get().trades
          .filter((trade) => {
            if (trade.isPaperTrade || trade.noTradeTaken) return false;
            const tradeDate = new Date(trade.date);
            return tradeDate.getFullYear() === year && tradeDate.getMonth() === month;
          })
          .reduce((sum, trade) => sum + trade.pnlAmount, 0);
      },

      getYearlyPnl: (year) => {
        return get().trades
          .filter((trade) => {
            if (trade.isPaperTrade || trade.noTradeTaken) return false;
            const tradeDate = new Date(trade.date);
            return tradeDate.getFullYear() === year;
          })
          .reduce((sum, trade) => sum + trade.pnlAmount, 0);
      },

      getTotalPnl: () => {
        return get().trades
          .filter((trade) => !trade.isPaperTrade && !trade.noTradeTaken)
          .reduce((sum, trade) => sum + trade.pnlAmount, 0);
      },
    }),
    {
      name: 'trade-log-storage',
    }
  )
);
