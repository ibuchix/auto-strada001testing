
/**
 * Changes made:
 * - 2024-12-09: Created dedicated hook for channel subscription management
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  handleNewBid, 
  handleBidStatusUpdate, 
  handleSellerBidUpdate,
  handleCarStatusUpdate,
  handleProxyBidUpdate,
  handleAuctionExtension
} from './eventHandlers';

type EnhancedToast = (
  type: 'success' | 'error' | 'info' | 'warning',
  title: string, 
  description?: string,
  duration?: number
) => void;

export const useChannelSubscription = (
  enhancedToast: EnhancedToast, 
  isConnected: boolean
) => {
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    // Only set up channels if we have a connection
    if (!isConnected) {
      console.log('Realtime connection not established, channels not subscribed');
      return;
    }
    
    // Set up channels using the channelSetup utility
    const newBidsChannel = setupNewBidsChannel(enhancedToast);
    const bidStatusChannel = setupBidStatusChannel(userId, enhancedToast);
    const sellerBidsChannel = setupSellerBidsChannel(userId, enhancedToast);
    const carStatusChannel = setupCarStatusChannel(enhancedToast);
    const proxyBidChannel = setupProxyBidChannel(enhancedToast);
    const auctionExtensionChannel = setupAuctionExtensionChannel(enhancedToast);

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(newBidsChannel);
      supabase.removeChannel(bidStatusChannel);
      supabase.removeChannel(sellerBidsChannel);
      supabase.removeChannel(carStatusChannel);
      supabase.removeChannel(proxyBidChannel);
      supabase.removeChannel(auctionExtensionChannel);
    };
  }, [enhancedToast, isConnected]);
};

// Individual channel setup functions
const setupNewBidsChannel = (enhancedToast: EnhancedToast) => {
  return supabase
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
};

const setupBidStatusChannel = (userId: string, enhancedToast: EnhancedToast) => {
  return supabase
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
};

const setupSellerBidsChannel = (userId: string, enhancedToast: EnhancedToast) => {
  return supabase
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
};

const setupCarStatusChannel = (enhancedToast: EnhancedToast) => {
  return supabase
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
};

const setupProxyBidChannel = (enhancedToast: EnhancedToast) => {
  return supabase
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
};

const setupAuctionExtensionChannel = (enhancedToast: EnhancedToast) => {
  return supabase
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
};
