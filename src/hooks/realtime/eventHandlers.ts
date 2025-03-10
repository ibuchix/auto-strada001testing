
/**
 * Changes made:
 * - 2024-04-02: Created eventHandlers to process different realtime bid events
 */

import { useToast } from '@/hooks/use-toast';

export type ToastFunction = ReturnType<typeof useToast>['toast'];

export const handleNewBid = (payload: any, toast: ToastFunction) => {
  toast({
    title: 'New Bid Received!',
    description: `A new bid of ${payload.new.amount.toLocaleString()} PLN has been placed on your vehicle.`,
  });
};

export const handleBidStatusUpdate = (payload: any, toast: ToastFunction) => {
  if (payload.new.status === 'accepted') {
    toast({
      title: 'Bid Accepted!',
      description: `Your bid of ${payload.new.amount.toLocaleString()} PLN has been accepted.`,
      variant: 'default',
    });
  } else if (payload.new.status === 'outbid') {
    toast({
      title: 'You\'ve Been Outbid',
      description: `Someone placed a higher bid than your ${payload.new.amount.toLocaleString()} PLN bid.`,
      variant: 'destructive',
    });
  } else if (payload.new.status === 'rejected') {
    toast({
      title: 'Bid Rejected',
      description: `Your bid of ${payload.new.amount.toLocaleString()} PLN was rejected.`,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Bid Status Updated',
      description: `Your bid status has been updated to: ${payload.new.status}`,
      variant: payload.new.status === 'accepted' ? 'default' : 'destructive',
    });
  }
};

export const handleSellerBidUpdate = (payload: any, toast: ToastFunction) => {
  const bidAmount = payload.new.amount.toLocaleString();
  let message = '';
  
  switch(payload.new.status) {
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
      message = `A bid of ${bidAmount} PLN changed status to: ${payload.new.status}`;
  }
  
  toast({
    title: 'Bid Status Changed',
    description: message,
  });
};

export const handleCarStatusUpdate = (payload: any, toast: ToastFunction) => {
  const oldStatus = payload.old.auction_status;
  const newStatus = payload.new.auction_status;
  
  let title = '';
  let description = '';
  
  if (newStatus === 'active' && oldStatus !== 'active') {
    title = 'Auction Started';
    description = `Auction for ${payload.new.make} ${payload.new.model} has started`;
  } else if (newStatus === 'ended' && oldStatus === 'active') {
    title = 'Auction Ended';
    description = `Auction for ${payload.new.make} ${payload.new.model} has ended`;
  } else if (newStatus === 'sold') {
    title = 'Vehicle Sold';
    description = `${payload.new.make} ${payload.new.model} has been sold for ${payload.new.current_bid?.toLocaleString()} PLN`;
  }
  
  if (title) {
    toast({ title, description });
  }
};
