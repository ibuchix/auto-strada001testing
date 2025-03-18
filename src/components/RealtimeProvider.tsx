/**
 * Changes made:
 * - 2024-09-07: Enhanced to include car status updates in real-time invalidation
 * - 2024-09-13: Added comprehensive real-time subscriptions for admin and dealer
 * - 2024-09-16: Added resilience with retry logic for channel subscriptions
 * - 2024-09-25: Added support for notification system
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeBids } from '@/hooks/useRealtimeBids';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

type CarRow = Database['public']['Tables']['cars']['Row'];

// Maximum retries for channel subscription
const MAX_SUBSCRIPTION_RETRIES = 3;

export const RealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  useRealtimeBids();

  useEffect(() => {
    let subscriptions: { unsubscribe: () => void }[] = [];
    
    // Helper function to subscribe with retry logic
    const subscribeWithRetry = async (
      channelName: string, 
      setupFn: (channel: any) => any,
      retries = 0
    ) => {
      try {
        const channel = supabase.channel(channelName);
        const subscription = setupFn(channel).subscribe();
        subscriptions.push(subscription);
        return subscription;
      } catch (error) {
        console.error(`Error subscribing to ${channelName}:`, error);
        
        if (retries < MAX_SUBSCRIPTION_RETRIES) {
          console.log(`Retrying subscription to ${channelName} (attempt ${retries + 1}/${MAX_SUBSCRIPTION_RETRIES})`);
          // Exponential backoff delay
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return subscribeWithRetry(channelName, setupFn, retries + 1);
        } else {
          toast.error(`Failed to establish realtime connection for ${channelName}`, {
            description: "You may not receive updates in real-time. Try refreshing the page."
          });
          return null;
        }
      }
    };

    // Subscribe to car changes for global state (affects all users)
    subscribeWithRetry('cars_changes', (channel) => 
      channel.on('postgres_changes', 
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
    );

    // For authenticated users, subscribe to additional real-time events
    if (session?.user) {
      // Check user role from local storage or session
      const userRole = localStorage.getItem('userRole');
      
      if (userRole === 'admin') {
        // Subscribe to verification requests
        subscribeWithRetry('admin-verification-requests', (channel) =>
          channel.on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'dealer_verifications'
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['verification_requests'] });
            }
          ).on('postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'listing_verifications'
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['listing_verification_requests'] });
            }
          )
        );
        
        // Subscribe to disputes
        subscribeWithRetry('admin-disputes', (channel) =>
          channel.on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'disputes'
            },
            () => {
              queryClient.invalidateQueries({ queryKey: ['disputes'] });
            }
          )
        );
      }
      
      // For dealers, subscribe to watchlist updates and auction activity
      if (userRole === 'dealer') {
        const dealerId = session.user.id;
        
        // Subscribe to watchlist updates
        subscribeWithRetry('dealer-watchlist', (channel) =>
          channel.on('postgres_changes',
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
        );
      }
      
      // Subscribe to notifications table for real-time notification invalidation
      subscribeWithRetry('user-notifications-invalidation', (channel) =>
        channel.on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', session.user.id] });
          }
        )
      );
    }

    return () => {
      subscriptions.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
    };
  }, [queryClient, session]);

  return <>{children}</>;
};
