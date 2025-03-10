
/**
 * Changes made:
 * - 2024-04-02: Created channelSetup utility to handle Supabase realtime channel configuration
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export interface ChannelSetupProps {
  userId: string;
  userRole: string;
  onNewBid: (payload: any) => void;
  onBidStatusUpdate: (payload: any) => void;
  onSellerBidUpdate: (payload: any) => void;
  onCarStatusUpdate: (payload: any) => void;
  toast: ReturnType<typeof useToast>['toast'];
}

export const setupBidsChannel = ({
  userId,
  userRole,
  onNewBid,
  onBidStatusUpdate,
  onSellerBidUpdate,
  onCarStatusUpdate,
  toast
}: ChannelSetupProps): RealtimeChannel => {
  console.log('Setting up real-time channel for bids');
  
  try {
    const channel = supabase
      .channel('bids-updates')
      // Listen for new bids on seller's cars
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
        },
        (payload) => {
          console.log('New bid received:', payload);
          onNewBid(payload);
        }
      )
      // Listen for bid status updates for dealers
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Bid status updated:', payload);
          onBidStatusUpdate(payload);
        }
      )
      // Listen for bid status updates on seller's cars
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')`,
        },
        (payload) => {
          // Only notify for status changes
          if (payload.old.status !== payload.new.status) {
            console.log('Bid on seller car updated:', payload);
            onSellerBidUpdate(payload);
          }
        }
      )
      // Listen for car status updates (auction started, ended, etc.)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: userRole === 'seller' 
            ? `seller_id=eq.${userId}` 
            : `id=in.(SELECT car_id FROM bids WHERE dealer_id='${userId}')`,
        },
        (payload) => {
          // Only notify for meaningful changes
          const oldStatus = payload.old.auction_status;
          const newStatus = payload.new.auction_status;
          
          if (oldStatus !== newStatus) {
            console.log('Car auction status changed:', payload);
            onCarStatusUpdate(payload);
          }
        }
      );
      
    return channel;
  } catch (error) {
    console.error('Error setting up real-time channel:', error);
    toast({
      title: 'Connection Error',
      description: 'Failed to connect to real-time updates. Will retry automatically.',
      variant: 'destructive',
    });
    throw error;
  }
};
