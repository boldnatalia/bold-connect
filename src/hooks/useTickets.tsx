import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Ticket, TicketStatus } from '@/types';
import { useAuth } from './useAuth';

export function useTickets() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ['tickets', user?.id, isAdmin],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select('*, profile:profiles(full_name, company, room, floor:floors(name))')
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Ticket[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async ({ title, description }: { title: string; description: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert({ title, description, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: TicketStatus; admin_notes?: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status, admin_notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });

  return {
    tickets: ticketsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading,
    error: ticketsQuery.error,
    createTicket,
    updateTicketStatus,
    refetch: ticketsQuery.refetch,
  };
}
