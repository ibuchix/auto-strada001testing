
/**
 * Changes made:
 * - 2024-09-07: Enhanced to include car status updates in real-time invalidation
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeBids } from '@/hooks/useRealtimeBids';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

type CarRow = Database['public']['Tables']['cars']['Row'];

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  useRealtimeBids();

  useEffect(() => {
    // Subscribe to car changes
    const subscription = supabase
      .channel('cars_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cars' 
        }, 
        (payload: RealtimePostgresChangesPayload<CarRow>) => {
          console.log('Received real-time update:', payload);
          
          // Invalidate relevant queries based on the change
          queryClient.invalidateQueries({ queryKey: ['cars'] });
          
          // Invalidate specific car query if we have the ID
          if (payload.new && 'id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['car', payload.new.id] });
          }
          
          // Invalidate seller's listings if we have seller_id
          if (payload.new && 'seller_id' in payload.new) {
            queryClient.invalidateQueries({ queryKey: ['seller_listings', payload.new.seller_id] });
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return <>{children}</>;
};
