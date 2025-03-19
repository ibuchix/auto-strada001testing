
/**
 * Changes made:
 * - 2024-12-11: Created dedicated hook for auction-related subscriptions
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useBaseSubscription } from './useBaseSubscription';

/**
 * Hook for auction related realtime subscriptions
 */
export const useAuctionSubscriptions = (userId: string | undefined, isActive: boolean) => {
  const { setupChannel, invalidateQueries, isActive: baseIsActive } = useBaseSubscription(userId, isActive);
  
  useEffect(() => {
    if (!userId || !isActive) return;
    
    // Subscribe to auction schedule changes
    const auctionScheduleChannel = setupChannel(
      'seller-auction-schedule-changes',
      'auction_schedules',
      `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
      '*',
      (payload) => {
        console.log('Real-time auction schedule update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['seller_auctions', userId]);
        
        if (payload.eventType === 'INSERT') {
          toast.info('Auction scheduled for your vehicle');
        } else if (payload.eventType === 'UPDATE') {
          const newRecord = payload.new as any;
          
          if (newRecord.status === 'running') {
            toast.info('Your auction has started');
          } else if (newRecord.status === 'completed') {
            toast.info('Your auction has been completed');
          } else if (newRecord.status === 'cancelled') {
            toast.info('Your auction has been cancelled');
          }
        }
      }
    );
    
    // Subscribe to auction results
    const auctionResultsChannel = setupChannel(
      'seller-auction-results-changes',
      'auction_results',
      `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
      'INSERT',
      (payload) => {
        console.log('Real-time auction result update received:', payload);
        
        // Invalidate the relevant queries
        invalidateQueries(['auction_results', userId]);
        
        const newRecord = payload.new as any;
        
        if (newRecord.sale_status === 'sold') {
          toast.success('Your auction has resulted in a sale!', {
            description: newRecord.final_price ? `Final price: ${newRecord.final_price}` : undefined
          });
        } else {
          toast.info('Your auction has ended without a sale');
        }
      }
    );
    
    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(auctionScheduleChannel);
      supabase.removeChannel(auctionResultsChannel);
    };
  }, [userId, isActive, setupChannel, invalidateQueries]);
};
