
/**
 * Changes made:
 * - 2024-09-13: Created hook for auction real-time updates to provide a centralized solution
 */

import { useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface AuctionRealtimeProps {
  session: Session | null;
  carId?: string;
  onBidPlaced?: (bid: any) => void;
  onAuctionStatusChange?: (status: string) => void;
  onAuctionExtended?: (newEndTime: string) => void;
}

export const useAuctionRealtime = ({
  session,
  carId,
  onBidPlaced,
  onAuctionStatusChange,
  onAuctionExtended
}: AuctionRealtimeProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    
    // Subscribe to new bids on this specific car
    const bidsChannel = supabase
      .channel(`auction-bids-${carId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: carId ? `car_id=eq.${carId}` : undefined
        },
        (payload) => {
          console.log('Real-time bid received:', payload);
          
          // Invalidate queries
          if (carId) {
            queryClient.invalidateQueries({ queryKey: ['car_bids', carId] });
          } else {
            queryClient.invalidateQueries({ queryKey: ['bids'] });
          }
          
          const bid = payload.new as any;
          
          // Notify about new bids
          if (bid.dealer_id !== userId) {
            toast.info('New bid placed', {
              description: `A new bid of ${bid.amount} has been placed`
            });
          }
          
          // Call the callback if provided
          if (onBidPlaced) {
            onBidPlaced(bid);
          }
        }
      )
      .subscribe();
      
    // Subscribe to auction status changes
    const carStatusChannel = supabase
      .channel(`auction-status-${carId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: carId ? `id=eq.${carId}` : undefined
        },
        (payload) => {
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Check if auction status changed
          if (oldRecord.auction_status !== newRecord.auction_status) {
            console.log('Auction status changed:', newRecord.auction_status);
            
            // Invalidate car data
            queryClient.invalidateQueries({ queryKey: ['car', newRecord.id] });
            
            // Notify based on status
            if (newRecord.auction_status === 'active') {
              toast.info('Auction started');
            } else if (newRecord.auction_status === 'ended') {
              toast.info('Auction ended without sale');
            } else if (newRecord.auction_status === 'sold') {
              toast.success('Auction completed with sale');
            }
            
            // Call callback if provided
            if (onAuctionStatusChange) {
              onAuctionStatusChange(newRecord.auction_status);
            }
          }
          
          // Check if auction end time was extended
          if (oldRecord.auction_end_time !== newRecord.auction_end_time) {
            console.log('Auction time extended:', newRecord.auction_end_time);
            
            // Invalidate car data
            queryClient.invalidateQueries({ queryKey: ['car', newRecord.id] });
            
            toast.info('Auction extended', {
              description: 'The auction end time has been extended'
            });
            
            // Call callback if provided
            if (onAuctionExtended && newRecord.auction_end_time) {
              onAuctionExtended(newRecord.auction_end_time);
            }
          }
        }
      )
      .subscribe();
      
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(carStatusChannel);
    };
  }, [session, carId, onBidPlaced, onAuctionStatusChange, onAuctionExtended, queryClient]);
};
