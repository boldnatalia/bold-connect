import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TicketComment } from '@/types';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

// Type-safe wrapper for ticket_comments table that's not yet in generated types
const ticketCommentsTable = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from('ticket_comments');
};

export function useTicketComments(ticketId: string) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['ticket-comments', ticketId],
    queryFn: async () => {
      const { data, error } = await ticketCommentsTable()
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as TicketComment[];
    },
    enabled: !!ticketId && !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!ticketId || !user) return;

    const channel = supabase
      .channel(`ticket-comments-${ticketId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ticket_comments',
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, user, queryClient]);

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (content.length > 50) {
        throw new Error('Máximo de 50 caracteres');
      }

      const { data, error } = await ticketCommentsTable()
        .insert([{
          ticket_id: ticketId,
          user_id: user!.id,
          content: content.trim(),
          is_admin: isAdmin,
        }])
        .select()
        .single();

      if (error) throw error;
      return data as TicketComment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-comments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error,
    addComment: addComment.mutate,
    isAdding: addComment.isPending,
  };
}
