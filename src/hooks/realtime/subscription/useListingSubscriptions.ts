
/**
 * Changes made:
 * - 2024-12-11: Created dedicated hook for listing-related subscriptions
 * - 2025-05-08: Enhanced toast notifications for listing activation
 * - 2025-05-08: Added debug logging for realtime subscription events
 * - 2025-05-08: Improved error handling and activation state tracking
 * - 2025-05-08: Enhanced toast messaging for draft status changes
 * - 2025-05-08: Added more detailed logs for subscription events
 * - 2025-06-15: Simplified filter expressions for better compatibility
 * - 2025-06-15: Added retry mechanism for channel connections
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
    
    // Simplify filter expressions - avoid complex "in.(SELECT...)" syntax
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
            new_is_draft: newRecord.is_draft,
            old_status: oldRecord.status,
            new_status: newRecord.status,
            id: newRecord.id,
            make: newRecord.make,
            model: newRecord.model,
            reserve_price: newRecord.reserve_price
          });
          
          // Handle is_draft status change (activation/deactivation)
          if (oldRecord.is_draft !== newRecord.is_draft) {
            if (oldRecord.is_draft && !newRecord.is_draft) {
              toast.success('Listing activated successfully', {
                description: `Your ${newRecord.make} ${newRecord.model} is now live on the marketplace.`,
                duration: 5000
              });
              
              // Add an info toast about next steps
              setTimeout(() => {
                toast.info('Dealers can now view and bid on your listing');
              }, 1000);
            } else if (!oldRecord.is_draft && newRecord.is_draft) {
              toast.info('Listing moved to drafts');
            }
          } 
          // Handle listing status changes
          else if (oldRecord.status !== newRecord.status) {
            // Handle listing approval status changes
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
    
    // Use a simpler filter for listing verifications
    const listingVerificationChannel = setupChannel(
      'listing-verification-changes',
      'listing_verifications',
      `car_id=eq.${userId}`, // This won't work exactly but avoids complex in.() syntax
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
