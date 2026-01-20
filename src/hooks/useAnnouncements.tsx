import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Announcement } from '@/types';
import { useAuth } from './useAuth';

export function useAnnouncements() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const announcementsQuery = useQuery({
    queryKey: ['announcements', isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Announcement[];
    },
    enabled: !!user,
  });

  const createAnnouncement = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert({ title, content, created_by: user!.id, is_active: true })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Announcement> & { id: string }) => {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  return {
    announcements: announcementsQuery.data ?? [],
    isLoading: announcementsQuery.isLoading,
    error: announcementsQuery.error,
    createAnnouncement: createAnnouncement.mutate,
    updateAnnouncement: updateAnnouncement.mutate,
    deleteAnnouncement: deleteAnnouncement.mutate,
    isCreating: createAnnouncement.isPending,
    isUpdating: updateAnnouncement.isPending,
    refetch: announcementsQuery.refetch,
  };
}
