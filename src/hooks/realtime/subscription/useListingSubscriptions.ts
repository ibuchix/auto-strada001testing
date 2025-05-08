
/**
 * Changes made:
 * - 2024-12-11: Created dedicated hook for listing-related subscriptions
 * - 2025-05-08: Enhanced toast notifications for listing activation
 * - 2025-05-08: Added debug logging for realtime subscription events
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
          toast.success('New listing created');
        } else if (payload.eventType === 'UPDATE') {
          // Check what specific status changed
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Log full details for debugging
          console.log('Listing update details:', {
            old: oldRecord,
            new: newRecord,
            is_draft_changed: oldRecord.is_draft !== newRecord.is_draft,
            old_is_draft: oldRecord.is_draft,
            new_is_draft: newRecord.is_draft
          });
          
          if (oldRecord.is_draft && !newRecord.is_draft) {
            toast.success('Listing activated successfully', {
              description: `Your ${newRecord.make} ${newRecord.model} is now live on the marketplace.`
            });
          } else if (oldRecord.status !== newRecord.status) {
            // Handle listing approval status changes
            if (newRecord.status === 'approved') {
              toast.success('Your listing has been approved');
            } else if (newRecord.status === 'rejected') {
              toast.error('Your listing was not approved');
            } else {
              toast.info(`Listing status changed to: ${newRecord.status}`);
            }
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
      }
    );
    
    // Subscribe to listing verification changes
    const listingVerificationChannel = setupChannel(
      'listing-verification-changes',
      'listing_verifications',
      `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
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
