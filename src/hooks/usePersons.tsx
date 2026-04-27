import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Person {
  id: string;
  conexa_id: number;
  customer_id: string | null;
  name: string;
  document: string | null;
  is_active: boolean;
}

export function usePersons() {
  const q = useQuery({
    queryKey: ['persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('id, conexa_id, customer_id, name, document, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Person[];
    },
  });

  return {
    persons: q.data ?? [],
    isLoading: q.isLoading,
    refetch: q.refetch,
  };
}

/** Persons filtered by a customer_id (local cache). Empty array if no customer selected. */
export function usePersonsByCustomer(customerId: string | null | undefined) {
  const { persons, isLoading } = usePersons();
  const filtered = customerId
    ? persons.filter(p => p.customer_id === customerId)
    : [];
  return { persons: filtered, isLoading };
}
