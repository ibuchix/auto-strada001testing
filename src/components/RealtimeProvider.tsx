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
          if (payload.new?.id) {
            queryClient.invalidateQueries({ queryKey: ['car', payload.new.id] });
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