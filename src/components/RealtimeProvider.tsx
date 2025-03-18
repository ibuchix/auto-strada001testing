
/**
 * Changes made:
 * - 2024-09-07: Enhanced to include car status updates in real-time invalidation
 * - 2024-09-13: Added comprehensive real-time subscriptions for admin and dealer
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeBids } from '@/hooks/useRealtimeBids';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/components/AuthProvider';

type CarRow = Database['public']['Tables']['cars']['Row'];

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  useRealtimeBids();

  useEffect(() => {
    // Subscribe to car changes for global state (affects all users)
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
        }
      )
      .subscribe();

    // For admin users, subscribe to additional real-time events
    let adminSubscriptions: { unsubscribe: () => void }[] = [];
    
    if (session?.user) {
      // Check user role from local storage or session
      const userRole = localStorage.getItem('userRole');
      
      if (userRole === 'admin') {
        // Subscribe to verification requests
        const verificationChannel = supabase
          .channel('admin-verification-requests')
          .on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'dealer_verifications'
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['verification_requests'] });
            }
          )
          .on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'listing_verifications'
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['listing_verification_requests'] });
            }
          )
          .subscribe();
          
        adminSubscriptions.push(verificationChannel);
        
        // Subscribe to disputes
        const disputesChannel = supabase
          .channel('admin-disputes')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'disputes'
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['disputes'] });
            }
          )
          .subscribe();
          
        adminSubscriptions.push(disputesChannel);
      }
      
      // For dealers, subscribe to watchlist updates and auction activity
      if (userRole === 'dealer') {
        const dealerId = session.user.id;
        
        // Subscribe to watchlist updates
        const watchlistChannel = supabase
          .channel('dealer-watchlist')
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'dealer_watchlist',
              filter: `buyer_id=eq.${dealerId}`
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['watchlist', dealerId] });
            }
          )
          .subscribe();
          
        adminSubscriptions.push(watchlistChannel);
      }
    }

    return () => {
      subscription.unsubscribe();
      adminSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [queryClient, session]);

  return <>{children}</>;
};
