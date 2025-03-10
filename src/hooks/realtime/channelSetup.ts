
/**
 * Changes made:
 * - 2024-04-02: Created channelSetup utility to handle Supabase realtime channel configuration
 * - 2024-06-15: Enhanced with additional event handlers for conflict resolution
 * - 2024-06-15: Added support for proxy bid and auction extension events
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
  onProxyBidUpdate?: (payload: any) => void;
  onAuctionExtension?: (payload: any) => void;
  toast: ReturnType<typeof useToast>['toast'];
}

export const setupBidsChannel = ({
  userId,
  userRole,
  onNewBid,
  onBidStatusUpdate,
  onSellerBidUpdate,
  onCarStatusUpdate,
  onProxyBidUpdate,
  onAuctionExtension,
  toast
}: ChannelSetupProps): RealtimeChannel => {
  console.log('Setting up real-time channel for bids');
  
  try {
    // Store user ID in localStorage for access in event handlers
    localStorage.setItem('userId', userId);
    
    const channel = supabase
      .channel('bids-updates')
      // Listen for new bids on seller's cars
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: userRole === 'seller' ? `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')` : undefined,
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
          filter: userRole === 'dealer' ? `dealer_id=eq.${userId}` : undefined,
        },
        (payload) => {
          // Only notify if status has changed
          if (payload.old.status !== payload.new.status) {
            console.log('Bid status updated:', payload);
            onBidStatusUpdate(payload);
          }
        }
      )
      // Listen for bid status updates on seller's cars
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: userRole === 'seller' ? `car_id=in.(SELECT id FROM cars WHERE seller_id='${userId}')` : undefined,
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
            : userRole === 'dealer'
              ? `id=in.(SELECT car_id FROM bids WHERE dealer_id='${userId}')`
              : undefined,
        },
        (payload) => {
          // Different handlers based on what changed
          
          // Handle auction status changes
          if (payload.old.auction_status !== payload.new.auction_status) {
            console.log('Car auction status changed:', payload);
            onCarStatusUpdate(payload);
          }
          
          // Handle auction extensions (when end time changes)
          if (payload.old.auction_end_time !== payload.new.auction_end_time && onAuctionExtension) {
            console.log('Auction time extended:', payload);
            onAuctionExtension(payload);
          }
        }
      );
      
    // If user is a dealer, also listen for proxy bid updates
    if (userRole === 'dealer' && onProxyBidUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proxy_bids',
          filter: `dealer_id=eq.${userId}`,
        },
        (payload) => {
          console.log('New proxy bid created:', payload);
          onProxyBidUpdate(payload);
        }
      ).on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'proxy_bids',
          filter: `dealer_id=eq.${userId}`,
        },
        (payload) => {
          // Only notify if max amount changed
          if (payload.old.max_bid_amount !== payload.new.max_bid_amount) {
            console.log('Proxy bid updated:', payload);
            onProxyBidUpdate(payload);
          }
        }
      );
    }
      
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
