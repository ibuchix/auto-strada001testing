
/**
 * Changes made:
 * - 2024-03-30: Enhanced real-time subscription with error handling
 * - 2024-03-30: Added reconnection logic with exponential backoff
 * - 2024-03-30: Improved bid conflict resolution
 * - 2024-03-30: Added comprehensive status notifications
 * - 2024-06-16: Added event handler for proxy bid updates and processing
 */

import { supabase } from '@/integrations/supabase/client';

// Handle incoming new bids
export const handleNewBid = (payload: any, toast: any) => {
  const userId = localStorage.getItem('userId');
  const { new: newBid } = payload;
  
  // Don't notify for your own bids
  if (newBid.dealer_id === userId) {
    return;
  }
  
  toast({
    title: 'New Bid Received',
    description: `A new bid of ${newBid.amount} has been placed`,
    duration: 5000,
  });
};

// Handle bid status updates for dealer's own bids
export const handleBidStatusUpdate = (payload: any, toast: any) => {
  const { new: newBidStatus, old: oldBidStatus } = payload;
  
  // Only notify if status changed to 'outbid'
  if (newBidStatus.status === 'outbid' && oldBidStatus.status !== 'outbid') {
    toast({
      title: 'You\'ve Been Outbid',
      description: `Your bid of ${newBidStatus.amount} has been outbid`,
      variant: 'destructive',
      duration: 6000,
    });
  }
};

// Handle bid updates on the seller's cars
export const handleSellerBidUpdate = (payload: any, toast: any) => {
  const { new: newBid } = payload;
  
  toast({
    title: 'Bid Updated',
    description: `A bid on your car has been ${newBid.status}`,
    duration: 5000,
  });
};

// Handle car status updates
export const handleCarStatusUpdate = (payload: any, toast: any) => {
  const { new: newCar, old: oldCar } = payload;
  
  if (newCar.auction_status === 'ended' && oldCar.auction_status === 'active') {
    toast({
      title: 'Auction Ended',
      description: `The auction for ${newCar.make} ${newCar.model} has ended`,
      duration: 8000,
    });
  } else if (newCar.auction_status === 'active' && oldCar.auction_status !== 'active') {
    toast({
      title: 'Auction Started',
      description: `The auction for ${newCar.make} ${newCar.model} is now active`,
      duration: 8000,
    });
  } else if (newCar.auction_status === 'sold' && oldCar.auction_status !== 'sold') {
    toast({
      title: 'Vehicle Sold',
      description: `The ${newCar.make} ${newCar.model} has been sold`,
      duration: 8000,
    });
  }
};

// Handle proxy bid updates
export const handleProxyBidUpdate = async (payload: any, toast: any) => {
  const { new: newProxyBid } = payload;
  const userId = localStorage.getItem('userId');
  
  // Only show notifications for your own proxy bids
  if (newProxyBid.dealer_id === userId) {
    toast({
      title: 'Proxy Bid Set',
      description: `Your proxy bid with maximum of ${newProxyBid.max_bid_amount} is active`,
      duration: 5000,
    });
    
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Trigger the edge function to process proxy bids
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/handle-seller-operations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              operation: 'process_proxy_bids',
              carId: newProxyBid.car_id
            }),
          }
        );
        
        if (!response.ok) {
          console.warn('Failed to process proxy bids:', await response.text());
        }
      } catch (error) {
        console.error('Error processing proxy bids:', error);
      }
    }
  }
};

// Handle auction time extension
export const handleAuctionExtension = (payload: any, toast: any) => {
  const { new: newCar } = payload;
  
  // Calculate how much time was added by comparing old and new end times
  const oldEndTime = new Date(payload.old.auction_end_time);
  const newEndTime = new Date(newCar.auction_end_time);
  const minutesAdded = Math.round((newEndTime.getTime() - oldEndTime.getTime()) / 60000);
  
  if (minutesAdded > 0) {
    toast({
      title: 'Auction Extended',
      description: `The auction for ${newCar.make} ${newCar.model} has been extended by ${minutesAdded} minutes`,
      duration: 6000,
    });
  }
};
