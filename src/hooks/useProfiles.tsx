import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

export function useProfiles() {
  const profilesQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      // Use the secure view that masks CPF for recepcao users
      const { data, error } = await supabase
        .from('profiles_secure')
        .select('*, floor:floors(*)')
        .order('company', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data as unknown as Profile[];
    },
  });

  return {
    profiles: profilesQuery.data ?? [],
    isLoading: profilesQuery.isLoading,
    error: profilesQuery.error,
    refetch: profilesQuery.refetch,
  };
}
