import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Person {
  id: string;
  conexa_id: number;
  customer_id: string | null;
  name: string;
  document: string | null;
  emails: string[] | null;
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

/** Extract a single best email from a Conexa person record. */
export function extractPersonEmail(person: Pick<Person, 'emails' | 'raw'>): string {
  const isEmail = (v: any): v is string =>
    typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const candidates: any[] = [
    ...(Array.isArray(person.emails) ? person.emails : []),
    person.raw?.email,
    person.raw?.mainEmail,
    person.raw?.primaryEmail,
    person.raw?.naturalPerson?.email,
    person.raw?.natural_person?.email,
    ...(Array.isArray(person.raw?.emails) ? person.raw.emails : []),
    ...(Array.isArray(person.raw?.contacts)
      ? person.raw.contacts.map((c: any) => c?.email ?? c?.value)
      : []),
  ];
  for (const v of candidates) {
    if (isEmail(v)) return v.trim().toLowerCase();
    if (v && typeof v === 'object' && isEmail((v as any).email)) {
      return (v as any).email.trim().toLowerCase();
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
        .select('id, conexa_id, customer_id, name, document, emails, is_active, raw')
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
