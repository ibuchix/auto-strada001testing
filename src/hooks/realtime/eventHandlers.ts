
/**
 * Changes made:
 * - 2024-03-30: Enhanced real-time subscription with error handling
 * - 2024-03-30: Added reconnection logic with exponential backoff
 * - 2024-03-30: Improved bid conflict resolution
 * - 2024-03-30: Added comprehensive status notifications
 * - 2024-06-16: Added event handler for proxy bid updates and processing
 * - 2024-06-18: Enhanced toast notifications with custom types and styled messages
 * - 2024-12-09: Refactored event handlers for better type safety and code organization
 * - 2024-12-10: Updated to handle Supabase payload types correctly
 * - 2024-12-11: Fixed typing issues with payload data access
 */

import { supabase } from '@/integrations/supabase/client';
import { EnhancedToast, RealtimePayload } from './types';

// Helper to access new data from payload regardless of event type
const getNewData = (payload: RealtimePayload): Record<string, any> => {
  return payload.new || {};
};

// Helper to access old data from payload regardless of event type
const getOldData = (payload: RealtimePayload): Record<string, any> => {
  return payload.old || {};
};

// Handle incoming new bids
export const handleNewBid = (payload: RealtimePayload, toast: EnhancedToast) => {
  const userId = localStorage.getItem('userId');
  const newBid = getNewData(payload);
  
  // Don't notify for your own bids
  if (newBid.dealer_id === userId) {
    return;
  }
  
  toast(
    'info',
    'New Bid Received',
    `A new bid of ${newBid.amount} has been placed`
  );
};

// Handle bid status updates for dealer's own bids
export const handleBidStatusUpdate = (payload: RealtimePayload, toast: EnhancedToast) => {
  const newBidStatus = getNewData(payload);
  const oldBidStatus = getOldData(payload);
  
  // Only notify if status changed to 'outbid'
  if (newBidStatus.status === 'outbid' && oldBidStatus.status !== 'outbid') {
    toast(
      'warning',
      'You\'ve Been Outbid',
      `Your bid of ${newBidStatus.amount} has been outbid`,
      6000
    );
  }
};

// Handle bid updates on the seller's cars
export const handleSellerBidUpdate = (payload: RealtimePayload, toast: EnhancedToast) => {
  const newBid = getNewData(payload);
  
  const bidStatus = newBid.status === 'active' ? 'success' : 'info';
  const statusText = newBid.status === 'active' ? 'accepted' : newBid.status;
  
  toast(
    bidStatus,
    'Bid Updated',
    `A bid on your car has been ${statusText}`
  );
};

// Handle car status updates
export const handleCarStatusUpdate = (payload: RealtimePayload, toast: EnhancedToast) => {
  const newCar = getNewData(payload);
  const oldCar = getOldData(payload);
  
  if (newCar.auction_status === 'ended' && oldCar.auction_status === 'active') {
    toast(
      'info',
      'Auction Ended',
      `The auction for ${newCar.make} ${newCar.model} has ended`,
      8000
    );
  } else if (newCar.auction_status === 'active' && oldCar.auction_status !== 'active') {
    toast(
      'success',
      'Auction Started',
      `The auction for ${newCar.make} ${newCar.model} is now active`,
      8000
    );
  } else if (newCar.auction_status === 'sold' && oldCar.auction_status !== 'sold') {
    toast(
      'success',
      'Vehicle Sold',
      `The ${newCar.make} ${newCar.model} has been sold`,
      8000
    );
  }
};

// Handle proxy bid updates
export const handleProxyBidUpdate = async (payload: RealtimePayload, toast: EnhancedToast) => {
  const newProxyBid = getNewData(payload);
  const userId = localStorage.getItem('userId');
  
  // Only show notifications for your own proxy bids
  if (newProxyBid.dealer_id === userId) {
    toast(
      'success',
      'Proxy Bid Set',
      `Your proxy bid with maximum of ${newProxyBid.max_bid_amount} is active`,
      5000
    );
    
    // Trigger proxy bid processing
    await triggerProxyBidProcessing(newProxyBid.car_id);
  }
};

// Helper function to process proxy bids
const triggerProxyBidProcessing = async (carId: string) => {
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
            carId
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
};

// Handle auction time extension
export const handleAuctionExtension = (payload: RealtimePayload, toast: EnhancedToast) => {
  const newCar = getNewData(payload);
  const oldCar = getOldData(payload);
  
  // Calculate how much time was added by comparing old and new end times
  const oldEndTime = new Date(oldCar.auction_end_time || new Date());
  const newEndTime = new Date(newCar.auction_end_time || new Date());
  const minutesAdded = Math.round((newEndTime.getTime() - oldEndTime.getTime()) / 60000);
  
  if (minutesAdded > 0) {
    toast(
      'info',
      'Auction Extended',
      `The auction for ${newCar.make} ${newCar.model} has been extended by ${minutesAdded} minutes`,
      6000
    );
  }
};
