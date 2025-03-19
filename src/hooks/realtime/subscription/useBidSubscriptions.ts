
/**
 * Changes made:
 * - 2024-12-11: Created dedicated hook for bid-related subscriptions
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBaseSubscription } from './useBaseSubscription';

/**
 * Hook for bid related realtime subscriptions
 */
export const useBidSubscriptions = (userId: string | undefined, isActive: boolean) => {
  const { setupChannel, invalidateQueries, isActive: baseIsActive } = useBaseSubscription(userId, isActive);
  
  useEffect(() => {
    if (!userId || !isActive) return;
    
    // Subscribe to bid updates on seller's cars
    const bidsChannel = setupChannel(
      'seller-bids-changes',
      'bids',
      `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
      'INSERT',
      (payload) => {
        console.log('Real-time bid update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['car_bids']);
        
        // New bid notification
        const newBid = payload.new as any;
        toast.success('New bid received', {
          description: `A bid of ${newBid.amount} has been placed on your vehicle`
        });
      }
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(bidsChannel);
    };
  }, [userId, isActive, setupChannel, invalidateQueries]);
};
