/**
 * Changes made:
 * - 2024-06-18: Enhanced with visual feedback using custom components
 * - 2024-06-18: Improved toast notifications with BidNotification component
 * - 2024-12-08: Added reconnection support for WebSocket connection failures
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  handleNewBid, 
  handleBidStatusUpdate, 
  handleSellerBidUpdate,
  handleCarStatusUpdate,
  handleProxyBidUpdate,
  handleAuctionExtension
} from './realtime/eventHandlers';
import { BidNotification } from '@/components/auction/BidNotification';
import { useRealtime } from '@/components/RealtimeProvider';

export const useRealtimeBids = () => {
  const { toast } = useToast();
  const { reconnect, isConnected } = useRealtime();
  
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    // Enhanced toast wrapper that uses our custom BidNotification component
    const enhancedToast = (
      type: 'success' | 'error' | 'info' | 'warning',
      title: string, 
      description?: string,
      duration = 5000
    ) => {
      toast({
        title: '', // Empty as we're using custom component
        description: (
          <BidNotification 
            type={type} 
            title={title} 
            description={description} 
          />
        ),
        duration,
        variant: type === 'error' ? 'destructive' : 'default',
      });
    };
    
    // Only set up channels if we have a connection
    if (!isConnected) {
      console.log('Realtime connection not established, channels not subscribed');
      return;
    }
    
    // Set up subscription for new bids
    const newBidsChannel = supabase
      .channel('new-bids')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
        },
        (payload) => handleNewBid(payload, enhancedToast)
      )
      .subscribe();

    // Set up subscription for bid status changes
    const bidStatusChannel = supabase
      .channel('bid-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${userId}`,
        },
        (payload) => handleBidStatusUpdate(payload, enhancedToast)
      )
      .subscribe();

    // Set up subscription for bid updates on seller's cars
    const sellerBidsChannel = supabase
      .channel('seller-bid-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `car.seller_id=eq.${userId}`,
        },
        (payload) => handleSellerBidUpdate(payload, enhancedToast)
      )
      .subscribe();

    // Set up subscription for car status updates
    const carStatusChannel = supabase
      .channel('car-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `auction_status=neq.pending`,
        },
        (payload) => handleCarStatusUpdate(payload, enhancedToast)
      )
      .subscribe();

    // Set up subscription for proxy bid updates
    const proxyBidChannel = supabase
      .channel('proxy-bid-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proxy_bids',
        },
        (payload) => handleProxyBidUpdate(payload, enhancedToast)
      )
      .subscribe();

    // Set up subscription for auction extensions
    const auctionExtensionChannel = supabase
      .channel('auction-extension-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `auction_status=eq.active`,
        },
        (payload) => handleAuctionExtension(payload, enhancedToast)
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(newBidsChannel);
      supabase.removeChannel(bidStatusChannel);
      supabase.removeChannel(sellerBidsChannel);
      supabase.removeChannel(carStatusChannel);
      supabase.removeChannel(proxyBidChannel);
      supabase.removeChannel(auctionExtensionChannel);
    };
  }, [toast, isConnected]);
  
  return { reconnect, isConnected };
};
