import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAccount } from './useAccount';
import { toast } from 'sonner';

export interface Folder {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  description: string | null;
  color: string | null;
  type: 'playbook' | 'backtest';
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface FolderInsert {
  name: string;
  description?: string;
  color?: string;
  type: 'playbook' | 'backtest';
}

export function useFolders(type: 'playbook' | 'backtest') {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const queryClient = useQueryClient();

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['folders', type, user?.id, activeAccount?.id],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type)
        .order('sort_order', { ascending: true });
      
      if (activeAccount) {
        query = query.eq('account_id', activeAccount.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Folder[];
    },
    enabled: !!user,
  });

  const createFolder = useMutation({
    mutationFn: async (folder: FolderInsert) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get the highest sort_order for this user/type
      const maxOrder = folders.length > 0 ? Math.max(...folders.map(f => f.sort_order || 0)) : -1;
      
      const { data, error } = await supabase
        .from('folders')
        .insert({
          ...folder,
          user_id: user.id,
          account_id: activeAccount?.id || null,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', type] });
      toast.success('Folder created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create folder: ' + error.message);
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Folder> & { id: string }) => {
      const { data, error } = await supabase
        .from('folders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', type] });
      toast.success('Folder updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update folder: ' + error.message);
    },
  });

  const duplicateFolder = useMutation({
    mutationFn: async (folder: Folder) => {
      if (!user) throw new Error('Not authenticated');
      
      // Get the highest sort_order for this user/type
      const maxOrder = folders.length > 0 ? Math.max(...folders.map(f => f.sort_order || 0)) : -1;
      
      const { data, error } = await supabase
        .from('folders')
        .insert({
          name: `${folder.name} (Copy)`,
          description: folder.description,
          color: folder.color,
          type: folder.type,
          user_id: user.id,
          account_id: activeAccount?.id || null,
          sort_order: maxOrder + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Folder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', type] });
      toast.success('Folder duplicated successfully');
    },
    onError: (error) => {
      toast.error('Failed to duplicate folder: ' + error.message);
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', type] });
      queryClient.invalidateQueries({ queryKey: [type === 'playbook' ? 'playbook' : 'backtests'] });
      toast.success('Folder deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete folder: ' + error.message);
    },
  });

  const reorderFolders = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase
          .from('folders')
          .update({ sort_order: index })
          .eq('id', id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', type] });
    },
    onError: (error) => {
      toast.error('Failed to reorder folders: ' + error.message);
    },
  });

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    duplicateFolder,
    deleteFolder,
    reorderFolders,
  };
}
