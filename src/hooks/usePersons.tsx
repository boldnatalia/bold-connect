import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Person {
  id: string;
  conexa_id: number;
  customer_id: string | null;
  name: string;
  document: string | null;
  is_active: boolean;
  raw: any | null;
}

/** Extract a CPF (digits only) from a Conexa person record. */
export function extractPersonCpf(person: Pick<Person, 'document' | 'raw'>): string {
  const candidates: any[] = [
    person.raw?.cpf,
    person.raw?.naturalPerson?.cpf,
    person.raw?.natural_person?.cpf,
    person.raw?.person?.cpf,
    person.raw?.document,
    person.document,
  ];
  for (const v of candidates) {
    if (typeof v === 'string' || typeof v === 'number') {
      const digits = String(v).replace(/\D/g, '');
      if (digits.length === 11) return digits;
    }
  }
  return '';
}

export function usePersons() {
  const q = useQuery({
    queryKey: ['persons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('id, conexa_id, customer_id, name, document, is_active, raw')
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
