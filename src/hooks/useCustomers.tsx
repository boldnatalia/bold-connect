import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  conexa_id: number;
  name: string;
  trade_name: string | null;
  document: string | null;
  is_active: boolean;
}

export function useCustomers() {
  const q = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, conexa_id, name, trade_name, document, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Customer[];
    },
  });

  return {
    customers: q.data ?? [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}
