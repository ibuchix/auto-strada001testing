
/**
 * Hook for fetching car history
 * Created: 2025-05-21
 */

import { useQuery } from '@tanstack/react-query';
import { getCarOwnershipHistory } from '@/services/supabase/carOwnershipService';

interface HistoryEntry {
  change_time: string;
  change_type: string;
  previous_status: string | null;
  new_status: string | null;
  is_draft: boolean;
  changed_by: string | null;
}

export const useCarHistory = (carId: string | undefined) => {
  return useQuery({
    queryKey: ['car-history', carId],
    queryFn: async () => {
      if (!carId) return [];
      return await getCarOwnershipHistory(carId);
    },
    enabled: !!carId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
};
