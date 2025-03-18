
/**
 * Changes made:
 * - 2024-09-07: Created hook for real-time listing status updates
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export const useRealtimeListings = (
  session: Session | null, 
  onListingUpdate: () => void
) => {
  useEffect(() => {
    if (!session?.user) return;

    // Subscribe to changes on the cars table for this seller
    const channel = supabase
      .channel('seller-listings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'cars',
          filter: `seller_id=eq.${session.user.id}`,
        },
        (payload) => {
          console.log('Real-time listing update received:', payload);
          
          // Determine what changed and show appropriate notification
          if (payload.eventType === 'INSERT') {
            toast.success('New listing created');
          } else if (payload.eventType === 'UPDATE') {
            // Check what specific status changed
            const oldRecord = payload.old as any;
            const newRecord = payload.new as any;
            
            if (oldRecord.is_draft && !newRecord.is_draft) {
              toast.success('Listing activated successfully');
            } else if (oldRecord.status !== newRecord.status) {
              toast.info(`Listing status changed to: ${newRecord.status}`);
            } else if (oldRecord.auction_status !== newRecord.auction_status) {
              if (newRecord.auction_status === 'sold') {
                toast.success('Your vehicle has been sold! 🎉');
              } else if (newRecord.auction_status === 'active') {
                toast.info('Your auction is now active');
              } else if (newRecord.auction_status === 'ended') {
                toast.info('Your auction has ended');
              }
            }
          } else if (payload.eventType === 'DELETE') {
            toast.info('Listing removed');
          }
          
          // Trigger refresh callback to update UI
          onListingUpdate();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, onListingUpdate]);
};
