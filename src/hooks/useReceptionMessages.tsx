import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ReceptionMessage } from '@/types';

export function useReceptionMessages() {
  const messagesQuery = useQuery({
    queryKey: ['reception-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reception_messages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as unknown as ReceptionMessage[];
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
  };
}
