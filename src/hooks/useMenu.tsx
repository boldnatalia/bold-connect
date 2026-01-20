import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MenuItem } from '@/types';
import { useAuth } from './useAuth';

export function useMenu() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const menuQuery = useQuery({
    queryKey: ['menu', isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!user,
  });

  const createMenuItem = useMutation({
    mutationFn: async (item: { name: string; description?: string | null; price: number; category?: string | null; is_available?: boolean; image_url?: string | null }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          name: item.name,
          description: item.description ?? null,
          price: item.price,
          category: item.category ?? null,
          is_available: item.is_available ?? true,
          image_url: item.image_url ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });

  const updateMenuItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MenuItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });

  return {
    menuItems: menuQuery.data ?? [],
    isLoading: menuQuery.isLoading,
    error: menuQuery.error,
    createMenuItem: createMenuItem.mutate,
    updateMenuItem: updateMenuItem.mutate,
    deleteMenuItem: deleteMenuItem.mutate,
    isCreating: createMenuItem.isPending,
    isUpdating: updateMenuItem.isPending,
    refetch: menuQuery.refetch,
  };
}
