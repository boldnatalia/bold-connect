import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MeetingRoom {
  id: string;
  name: string;
  floor: string;
  capacity: number | null;
  description: string | null;
  is_available: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useMeetingRooms() {
  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ['meeting-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('is_available', true)
        .order('floor', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as MeetingRoom[];
    },
  });

  return { rooms, isLoading, error };
}
