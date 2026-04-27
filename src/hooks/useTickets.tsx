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
      if (error) {
        console.error('[useTickets] Erro ao buscar chamados:', error);
        throw error;
      }
      
      // Fetch profile + latest admin comment timestamp per ticket
      const ticketsEnriched = await Promise.all(
        (data || []).map(async (ticket) => {
          const [{ data: profileData }, { data: lastAdminComment }] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, company, room, floor:floors(name)')
              .eq('user_id', ticket.user_id)
              .single(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (supabase as any)
              .from('ticket_comments')
              .select('created_at')
              .eq('ticket_id', ticket.id)
              .eq('is_admin', true)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);

          return {
            ...ticket,
            profile: profileData,
            last_admin_comment_at: lastAdminComment?.created_at ?? null,
          };
        })
      );

      return ticketsEnriched as unknown as Ticket[];
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

      if (error) {
        console.error('[useTickets] Erro ao criar chamado:', error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (err) => {
      console.error('[useTickets] createTicket falhou:', err);
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
