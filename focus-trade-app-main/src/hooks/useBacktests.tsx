import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { toast } from 'sonner';

export interface SelectedNewsEvent {
  title: string;
  impact: string;
  currency?: string;
  time?: string;
}

export interface Backtest {
  id: string;
  user_id: string;
  account_id: string | null;
  folder_id: string | null;
  name: string;
  strategy: string | null;
  symbol: string | null;
  timeframe: string | null;
  date: string | null;
  day_of_week: string | null;
  session: string | null;
  entry_time: string | null;
  has_news: boolean | null;
  news_impact: string | null;
  news_events: SelectedNewsEvent[] | null;
  sort_order: number | null;
  win_rate: number;
  profit_factor: number;
  total_trades: number;
  net_pnl: number;
  notes: string | null;
  images: string[];
  wins: number;
  losses: number;
  created_at: string;
  updated_at: string;
}

export interface BacktestInsert {
  name: string;
  folder_id: string;
  strategy?: string;
  symbol?: string;
  timeframe?: string;
  win_rate?: number;
  profit_factor?: number;
  total_trades?: number;
  net_pnl?: number;
  notes?: string;
  images?: string[];
  wins?: number;
  losses?: number;
  date?: string;
  day_of_week?: string;
  session?: string;
  entry_time?: string;
  has_news?: boolean;
  news_impact?: string;
  news_events?: SelectedNewsEvent[];
}

export function useBacktests(folderId?: string | null) {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const queryClient = useQueryClient();

  const { data: backtests = [], isLoading } = useQuery({
    queryKey: ['backtests', user?.id, activeAccount?.id, folderId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('backtests')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (activeAccount) {
        query = query.eq('account_id', activeAccount.id);
      }
      
      if (folderId) {
        query = query.eq('folder_id', folderId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      // Cast the data and transform news_events from Json to our interface
      return (data || []).map((item: any) => ({
        ...item,
        news_events: item.news_events as SelectedNewsEvent[] | null,
      })) as Backtest[];
    },
    enabled: !!user,
  });

  const createBacktest = useMutation({
    mutationFn: async (backtest: BacktestInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('backtests')
        .insert({
          name: backtest.name,
          folder_id: backtest.folder_id,
          user_id: user.id,
          account_id: activeAccount?.id || null,
          strategy: backtest.strategy,
          symbol: backtest.symbol,
          timeframe: backtest.timeframe,
          win_rate: backtest.win_rate,
          profit_factor: backtest.profit_factor,
          total_trades: backtest.total_trades,
          net_pnl: backtest.net_pnl,
          notes: backtest.notes,
          images: backtest.images,
          wins: backtest.wins,
          losses: backtest.losses,
          date: backtest.date,
          day_of_week: backtest.day_of_week,
          session: backtest.session,
          has_news: backtest.has_news,
          news_impact: backtest.news_impact,
          news_events: backtest.news_events as any,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] });
      toast.success('Backtest created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create backtest: ' + error.message);
    },
  });

  const updateBacktest = useMutation({
    mutationFn: async ({ id, news_events, ...updates }: Partial<Backtest> & { id: string }) => {
      const { data, error } = await supabase
        .from('backtests')
        .update({
          ...updates,
          news_events: news_events as any,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] });
      toast.success('Backtest updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update backtest: ' + error.message);
    },
  });

  const deleteBacktest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('backtests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] });
      toast.success('Backtest deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete backtest: ' + error.message);
    },
  });

  const reorderBacktests = useMutation({
    mutationFn: async (backtestIds: string[]) => {
      const updates = backtestIds.map((id, index) => 
        supabase
          .from('backtests')
          .update({ sort_order: index })
          .eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backtests'] });
    },
    onError: (error) => {
      toast.error('Failed to reorder backtests: ' + error.message);
    },
  });

  return {
    backtests,
    isLoading,
    createBacktest,
    updateBacktest,
    deleteBacktest,
    reorderBacktests,
  };
}