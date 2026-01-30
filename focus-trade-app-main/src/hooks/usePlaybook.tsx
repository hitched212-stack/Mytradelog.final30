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

export interface PlaybookSetup {
  id: string;
  user_id: string;
  account_id: string | null;
  folder_id: string | null;
  name: string;
  symbol: string | null;
  category: string | null;
  description: string | null;
  win_rate: number;
  risk_reward: string | null;
  timeframe: string | null;
  entry_criteria: string | null;
  exit_criteria: string | null;
  images: string[];
  is_favorite: boolean;
  wins: number;
  losses: number;
  session: string | null;
  day_of_week: string | null;
  date: string | null;
  entry_time: string | null;
  has_news: boolean;
  news_impact: string | null;
  news_events: SelectedNewsEvent[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaybookSetupInsert {
  name: string;
  folder_id: string;
  symbol?: string;
  category?: string;
  description?: string;
  win_rate?: number;
  risk_reward?: string;
  timeframe?: string;
  entry_criteria?: string;
  exit_criteria?: string;
  images?: string[];
  is_favorite?: boolean;
  wins?: number;
  losses?: number;
  session?: string;
  day_of_week?: string;
  date?: string;
  entry_time?: string;
  has_news?: boolean;
  news_impact?: string;
  news_events?: SelectedNewsEvent[];
  notes?: string;
}

export function usePlaybook(folderId?: string | null) {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const queryClient = useQueryClient();

  const { data: setups = [], isLoading } = useQuery({
    queryKey: ['playbook', user?.id, activeAccount?.id, folderId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('playbook_setups')
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
      })) as PlaybookSetup[];
    },
    enabled: !!user,
  });

  const createSetup = useMutation({
    mutationFn: async (setup: PlaybookSetupInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('playbook_setups')
        .insert({
          name: setup.name,
          folder_id: setup.folder_id,
          user_id: user.id,
          account_id: activeAccount?.id || null,
          symbol: setup.symbol,
          category: setup.category,
          description: setup.description,
          win_rate: setup.win_rate,
          risk_reward: setup.risk_reward,
          timeframe: setup.timeframe,
          entry_criteria: setup.entry_criteria,
          exit_criteria: setup.exit_criteria,
          images: setup.images,
          is_favorite: setup.is_favorite,
          wins: setup.wins,
          losses: setup.losses,
          session: setup.session,
          day_of_week: setup.day_of_week,
          date: setup.date,
          has_news: setup.has_news,
          news_impact: setup.news_impact,
          news_events: setup.news_events as any,
          notes: setup.notes,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook'] });
      toast.success('Setup created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create setup: ' + error.message);
    },
  });

  const updateSetup = useMutation({
    mutationFn: async ({ id, news_events, ...updates }: Partial<PlaybookSetup> & { id: string }) => {
      const { data, error } = await supabase
        .from('playbook_setups')
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
      queryClient.invalidateQueries({ queryKey: ['playbook'] });
      toast.success('Setup updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update setup: ' + error.message);
    },
  });

  const deleteSetup = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('playbook_setups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook'] });
      toast.success('Setup deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete setup: ' + error.message);
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { data, error } = await supabase
        .from('playbook_setups')
        .update({ is_favorite })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook'] });
    },
    onError: (error) => {
      toast.error('Failed to update favorite: ' + error.message);
    },
  });

  const reorderSetups = useMutation({
    mutationFn: async (setupIds: string[]) => {
      const updates = setupIds.map((id, index) => 
        supabase
          .from('playbook_setups')
          .update({ sort_order: index })
          .eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbook'] });
    },
    onError: (error) => {
      toast.error('Failed to reorder setups: ' + error.message);
    },
  });

  return {
    setups,
    isLoading,
    createSetup,
    updateSetup,
    deleteSetup,
    toggleFavorite,
    reorderSetups,
  };
}