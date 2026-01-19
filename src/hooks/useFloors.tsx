import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Floor } from '@/types';

export function useFloors() {
  const floorsQuery = useQuery({
    queryKey: ['floors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .order('floor_number', { ascending: true });

      if (error) throw error;
      return data as Floor[];
    },
  });

  return {
    floors: floorsQuery.data ?? [],
    isLoading: floorsQuery.isLoading,
    error: floorsQuery.error,
    refetch: floorsQuery.refetch,
  };
}
