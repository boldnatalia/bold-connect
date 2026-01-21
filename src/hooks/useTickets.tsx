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
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch profile data separately for each ticket
      const ticketsWithProfiles = await Promise.all(
        (data || []).map(async (ticket) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, company, room, floor:floors(name)')
            .eq('user_id', ticket.user_id)
            .single();
          
          return {
            ...ticket,
            profile: profileData
          };
        })
      );
      
      return ticketsWithProfiles as unknown as Ticket[];
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

  const updateTicket = useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status?: TicketStatus; admin_notes?: string }) => {
      const updates: { status?: TicketStatus; admin_notes?: string } = {};
      if (status) updates.status = status;
      if (admin_notes !== undefined) updates.admin_notes = admin_notes;
      
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
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
    createTicket: createTicket.mutate,
    updateTicket: updateTicket.mutate,
    isCreating: createTicket.isPending,
    isUpdating: updateTicket.isPending,
    refetch: ticketsQuery.refetch,
  };
}
