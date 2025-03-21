
/**
 * Changes made:
 * - 2024-12-09: Created dedicated hook for channel subscription management
 * - 2024-12-10: Updated to use correct Supabase payload types
 * - 2024-12-13: Enhanced error handling and connection status awareness
 * - 2024-12-13: Added graceful degradation when realtime connection is unavailable
 */

import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  handleNewBid, 
  handleBidStatusUpdate, 
  handleSellerBidUpdate,
  handleCarStatusUpdate,
  handleProxyBidUpdate,
  handleAuctionExtension
} from './eventHandlers';
import { EnhancedToast } from './types';

export const useChannelSubscription = (
  enhancedToast: EnhancedToast, 
  isConnected: boolean
) => {
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.log('No userId found in localStorage, skipping channel subscription');
      return;
    }
    
    // Only set up channels if we have a connection
    if (!isConnected) {
      console.log('Realtime connection not established, channels not subscribed');
      return;
    }
    
    console.log('Setting up realtime channels for user:', userId);
    
    // Set up channels with error handling
    try {
      const newBidsChannel = setupNewBidsChannel(enhancedToast);
      const bidStatusChannel = setupBidStatusChannel(userId, enhancedToast);
      const sellerBidsChannel = setupSellerBidsChannel(userId, enhancedToast);
      const carStatusChannel = setupCarStatusChannel(enhancedToast);
      const proxyBidChannel = setupProxyBidChannel(enhancedToast);
      const auctionExtensionChannel = setupAuctionExtensionChannel(enhancedToast);
  
      // Cleanup on unmount with error handling
      return () => {
        try {
          console.log('Cleaning up realtime channels');
          if (newBidsChannel) supabase.removeChannel(newBidsChannel);
          if (bidStatusChannel) supabase.removeChannel(bidStatusChannel);
          if (sellerBidsChannel) supabase.removeChannel(sellerBidsChannel);
          if (carStatusChannel) supabase.removeChannel(carStatusChannel);
          if (proxyBidChannel) supabase.removeChannel(proxyBidChannel);
          if (auctionExtensionChannel) supabase.removeChannel(auctionExtensionChannel);
        } catch (error) {
          console.error('Error removing channels during cleanup:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up realtime channels:', error);
      // Don't rethrow - allow the app to continue without realtime features
    }
  }, [enhancedToast, isConnected]);
};

// Wrap channel setup functions with error handling
const safeChannelSetup = (setupFn: () => any) => {
  try {
    return setupFn();
  } catch (error) {
    console.error('Error setting up channel:', error);
    return null;
  }
};

// Individual channel setup functions
const setupNewBidsChannel = (enhancedToast: EnhancedToast) => {
  return safeChannelSetup(() => 
    supabase
      .channel('new-bids')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          try {
            handleNewBid(payload, enhancedToast);
          } catch (error) {
            console.error('Error handling new bid:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('New bids channel status:', status);
      })
  );
};

const setupBidStatusChannel = (userId: string, enhancedToast: EnhancedToast) => {
  return safeChannelSetup(() => 
    supabase
      .channel('bid-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bids',
          filter: `dealer_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          try {
            handleBidStatusUpdate(payload, enhancedToast);
          } catch (error) {
            console.error('Error handling bid status update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Bid status channel status:', status);
      })
  );
};

const setupSellerBidsChannel = (userId: string, enhancedToast: EnhancedToast) => {
  return safeChannelSetup(() => 
    supabase
      .channel('seller-bid-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
          filter: `car.seller_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          try {
            handleSellerBidUpdate(payload, enhancedToast);
          } catch (error) {
            console.error('Error handling seller bid update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Seller bids channel status:', status);
      })
  );
};

const setupCarStatusChannel = (enhancedToast: EnhancedToast) => {
  return safeChannelSetup(() => 
    supabase
      .channel('car-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `auction_status=neq.pending`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          try {
            handleCarStatusUpdate(payload, enhancedToast);
          } catch (error) {
            console.error('Error handling car status update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Car status channel status:', status);
      })
  );
};

const setupProxyBidChannel = (enhancedToast: EnhancedToast) => {
  return safeChannelSetup(() => 
    supabase
      .channel('proxy-bid-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'proxy_bids',
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          try {
            handleProxyBidUpdate(payload, enhancedToast);
          } catch (error) {
            console.error('Error handling proxy bid update:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Proxy bid channel status:', status);
      })
  );
};

const setupAuctionExtensionChannel = (enhancedToast: EnhancedToast) => {
  return safeChannelSetup(() => 
    supabase
      .channel('auction-extension-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `auction_status=eq.active`,
        },
        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
          try {
            handleAuctionExtension(payload, enhancedToast);
          } catch (error) {
            console.error('Error handling auction extension:', error);
          }
        }
      )
      .subscribe((status) => {
        console.log('Auction extension channel status:', status);
      })
  );
};
