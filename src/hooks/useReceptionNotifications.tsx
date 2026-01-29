import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ReceptionNotification } from '@/types';

export function useReceptionNotifications() {
  const { user, isRecepcao, isCentralAtendimento, isCliente } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['reception-notifications', user?.id, isCliente],
    queryFn: async () => {
      let query = supabase
        .from('reception_notifications')
        .select(`
          *,
          message:reception_messages(*),
          recipient:profiles(full_name, company, room, floor:floors(name))
        `)
        .order('created_at', { ascending: false });

      // Clients only see their own notifications
      if (isCliente) {
        query = query.eq('recipient_id', user!.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as ReceptionNotification[];
    },
    enabled: !!user,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async ({
      recipientId,
      messageId,
      inputValue,
      requiresResponse,
    }: {
      recipientId: string;
      messageId: string;
      inputValue?: string;
      requiresResponse?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('reception_notifications')
        .insert({
          sender_id: user!.id,
          recipient_id: recipientId,
          message_id: messageId,
          input_value: inputValue || null,
          requires_response: requiresResponse || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-notifications'] });
    },
  });

  const respondToNotificationMutation = useMutation({
    mutationFn: async ({
      notificationId,
      responseValue,
    }: {
      notificationId: string;
      responseValue: string;
    }) => {
      const { data, error } = await supabase
        .from('reception_notifications')
        .update({
          response_value: responseValue,
          responded_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-notifications'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('reception_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reception-notifications'] });
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const pendingResponses = notifications.filter(
    n => n.requires_response && !n.response_value
  );
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    pendingResponses,
    unreadCount,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    sendNotification: sendNotificationMutation.mutateAsync,
    respondToNotification: respondToNotificationMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutate,
    isSending: sendNotificationMutation.isPending,
    refetch: notificationsQuery.refetch,
  };
}
