
/**
 * Changes made:
 * - 2024-04-02: Created eventHandlers to process different realtime bid events
 * - 2024-06-15: Enhanced bid event handlers with better conflict resolution
 * - 2024-06-15: Added more detailed notifications for different event types
 */

import { useToast } from '@/hooks/use-toast';

export type ToastFunction = ReturnType<typeof useToast>['toast'];

export const handleNewBid = (payload: any, toast: ToastFunction) => {
  // Get the bid details
  const bidAmount = payload.new.amount.toLocaleString();
  const isUserBid = payload.new.dealer_id === localStorage.getItem('userId');
  
  // Different notification based on whether it's the user's bid or not
  if (!isUserBid) {
    toast({
      title: 'New Bid Received!',
      description: `A new bid of ${bidAmount} PLN has been placed on your vehicle.`,
    });
  }
};

export const handleBidStatusUpdate = (payload: any, toast: ToastFunction) => {
  // Track the source of the status change for better notifications
  const oldStatus = payload.old.status;
  const newStatus = payload.new.status;
  const bidAmount = payload.new.amount.toLocaleString();
  
  // Only notify if there's an actual status change
  if (oldStatus === newStatus) return;
  
  // Handle different status transitions
  if (newStatus === 'accepted') {
    toast({
      title: 'Bid Accepted!',
      description: `Your bid of ${bidAmount} PLN has been accepted.`,
      variant: 'default',
    });
  } else if (newStatus === 'outbid') {
    // Play a sound on outbid if available
    try {
      const audio = new Audio('/sounds/outbid.mp3');
      audio.play().catch(e => console.log('Could not play notification sound'));
    } catch (e) {
      // Silently fail if audio not supported
    }
    
    toast({
      title: 'You\'ve Been Outbid',
      description: `Someone placed a higher bid than your ${bidAmount} PLN bid.`,
      variant: 'destructive',
    });
  } else if (newStatus === 'rejected') {
    toast({
      title: 'Bid Rejected',
      description: `Your bid of ${bidAmount} PLN was rejected.`,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Bid Status Updated',
      description: `Your bid status has been updated to: ${newStatus}`,
      variant: newStatus === 'accepted' ? 'default' : 'destructive',
    });
  }
};

export const handleSellerBidUpdate = (payload: any, toast: ToastFunction) => {
  const bidAmount = payload.new.amount.toLocaleString();
  const oldStatus = payload.old.status;
  const newStatus = payload.new.status;
  
  // Only notify if there's an actual status change
  if (oldStatus === newStatus) return;
  
  let message = '';
  
  switch(newStatus) {
    case 'accepted':
      message = `You've accepted a bid of ${bidAmount} PLN`;
      break;
    case 'rejected':
      message = `You've rejected a bid of ${bidAmount} PLN`;
      break;
    case 'outbid':
      message = `A bid of ${bidAmount} PLN was outbid by another dealer`;
      break;
    default:
      message = `A bid of ${bidAmount} PLN changed status to: ${newStatus}`;
  }
  
  toast({
    title: 'Bid Status Changed',
    description: message,
  });
};

export const handleCarStatusUpdate = (payload: any, toast: ToastFunction) => {
  const oldStatus = payload.old.auction_status;
  const newStatus = payload.new.auction_status;
  
  // Skip if there's no status change
  if (oldStatus === newStatus) return;
  
  let title = '';
  let description = '';
  let variant: 'default' | 'destructive' = 'default';
  
  if (newStatus === 'active' && oldStatus !== 'active') {
    title = 'Auction Started';
    description = `Auction for ${payload.new.make} ${payload.new.model} has started`;
  } else if (newStatus === 'ended' && oldStatus === 'active') {
    title = 'Auction Ended';
    description = `Auction for ${payload.new.make} ${payload.new.model} has ended`;
  } else if (newStatus === 'sold') {
    title = 'Vehicle Sold';
    description = `${payload.new.make} ${payload.new.model} has been sold for ${payload.new.current_bid?.toLocaleString()} PLN`;
  } else if (newStatus === 'cancelled') {
    title = 'Auction Cancelled';
    description = `The auction for ${payload.new.make} ${payload.new.model} has been cancelled`;
    variant = 'destructive';
  }
  
  if (title) {
    toast({ 
      title, 
      description,
      variant 
    });
  }
};

// Handle proxy bid events - when a proxy bid is triggered automatically
export const handleProxyBidUpdate = (payload: any, toast: ToastFunction) => {
  const isBidderSelf = localStorage.getItem('userId') === payload.new.dealer_id;
  
  if (isBidderSelf) {
    toast({
      title: 'Proxy Bid Updated',
      description: `Your maximum proxy bid is now ${payload.new.max_bid_amount.toLocaleString()} PLN`,
    });
  }
};

// Handle edge cases like auction extensions when last-minute bids are placed
export const handleAuctionExtension = (payload: any, toast: ToastFunction) => {
  const oldEndTime = new Date(payload.old.auction_end_time);
  const newEndTime = new Date(payload.new.auction_end_time);
  
  // If end time was extended by more than 1 minute
  if (newEndTime.getTime() - oldEndTime.getTime() > 60000) {
    toast({
      title: 'Auction Extended',
      description: `The auction has been extended due to last-minute bidding activity.`,
    });
  }
};
