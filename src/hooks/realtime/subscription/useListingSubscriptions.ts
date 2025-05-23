
/**
 * Changes made:
 * - 2025-05-23: Removed is_draft system, simplified realtime notifications
 * - All listings are immediately available, removed activation tracking
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBaseSubscription } from './useBaseSubscription';

/**
 * Hook for listing related realtime subscriptions
 */
export const useListingSubscriptions = (userId: string | undefined, isActive: boolean) => {
  const { setupChannel, invalidateQueries, isActive: baseIsActive } = useBaseSubscription(userId, isActive);
  
  useEffect(() => {
    if (!userId || !isActive) return;
    
    console.log('Setting up realtime listing subscriptions for user:', userId);
    
    // Subscribe to listing changes (status updates, approvals, etc.)
    const listingsChannel = setupChannel(
      'seller-listings-changes',
      'cars',
      `seller_id=eq.${userId}`,
      '*',
      (payload) => {
        console.log('Real-time listing update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['seller_listings', userId]);
        
        // Determine what changed and show appropriate notification
        if (payload.eventType === 'INSERT') {
          toast.success('New listing created and is now live');
        } else if (payload.eventType === 'UPDATE') {
          // Check what specific status changed
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Handle listing status changes
          if (oldRecord.status !== newRecord.status) {
            if (newRecord.status === 'approved') {
              toast.success('Your listing has been approved');
            } else if (newRecord.status === 'rejected') {
              toast.error('Your listing was not approved');
            } else {
              toast.info(`Listing status changed to: ${newRecord.status}`);
            }
          } 
          // Handle auction status changes
          else if (oldRecord.auction_status !== newRecord.auction_status) {
            if (newRecord.auction_status === 'sold') {
              toast.success('Your vehicle has been sold! 🎉');
            } else if (newRecord.auction_status === 'active') {
              toast.info('Your auction is now active');
            } else if (newRecord.auction_status === 'ended') {
              toast.info('Your auction has ended');
            }
          }
          // Handle reserve price changes
          else if (oldRecord.reserve_price !== newRecord.reserve_price) {
            console.log(`Reserve price updated from ${oldRecord.reserve_price} to ${newRecord.reserve_price}`);
          }
          // Handle other changes
          else {
            toast.info('Listing details updated');
          }
        } else if (payload.eventType === 'DELETE') {
          toast.info('Listing removed');
        }
      }
    );
    
    // Subscribe to listing verification changes
    const listingVerificationChannel = setupChannel(
      'listing-verification-changes',
      'listing_verifications',
      `car_id=eq.${userId}`,
      '*',
      (payload) => {
        console.log('Real-time listing verification update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['listing_verifications']);
        
        if (payload.eventType === 'UPDATE') {
          const newRecord = payload.new as any;
          
          if (newRecord.verification_status === 'approved') {
            toast.success('Your listing has been verified!');
          } else if (newRecord.verification_status === 'rejected') {
            toast.error('Your listing verification was rejected', {
              description: newRecord.rejection_reason ? `Reason: ${newRecord.rejection_reason}` : undefined
            });
          }
        }
      }
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up realtime listing subscriptions');
      supabase.removeChannel(listingsChannel);
      supabase.removeChannel(listingVerificationChannel);
    };
  }, [userId, isActive, setupChannel, invalidateQueries]);
};
