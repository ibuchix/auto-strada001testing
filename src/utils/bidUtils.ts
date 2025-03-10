
/**
 * Changes made:
 * - 2024-03-30: Created bid utilities for handling bid placement and conflict resolution
 */

import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

type PlaceBidParams = {
  carId: string;
  dealerId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
};

export const placeBid = async ({
  carId,
  dealerId,
  amount,
  isProxy = false,
  maxProxyAmount,
}: PlaceBidParams) => {
  try {
    // First check if the car is still available for bidding
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, price, current_bid, auction_status, minimum_bid_increment')
      .eq('id', carId)
      .single();
    
    if (carError) {
      console.error('Error fetching car details:', carError);
      toast({
        title: 'Error',
        description: 'Could not retrieve car details',
        variant: 'destructive',
      });
      return { success: false, error: carError };
    }
    
    // Validate auction is active
    if (car.auction_status !== 'active') {
      toast({
        title: 'Bidding Closed',
        description: 'This auction is not currently active',
        variant: 'destructive',
      });
      return { success: false, error: 'Auction not active' };
    }
    
    // Validate bid is high enough
    const minBid = car.current_bid 
      ? car.current_bid + (car.minimum_bid_increment || 100)
      : car.price;
      
    if (amount < minBid) {
      toast({
        title: 'Bid Too Low',
        description: `Minimum bid required is ${minBid.toLocaleString()} PLN`,
        variant: 'destructive',
      });
      return { success: false, error: 'Bid too low' };
    }

    // Start a transaction to handle bid placement
    const { data, error } = await supabase.rpc('place_bid', {
      p_car_id: carId,
      p_dealer_id: dealerId,
      p_amount: amount,
      p_is_proxy: isProxy,
      p_max_proxy_amount: maxProxyAmount || amount
    });
    
    if (error) {
      console.error('Error placing bid:', error);
      
      // Handle specific error cases
      if (error.message.includes('outbid')) {
        toast({
          title: 'Outbid',
          description: 'Someone else placed a higher bid just now. Please try again.',
          variant: 'destructive',
        });
      } else if (error.message.includes('auction ended')) {
        toast({
          title: 'Auction Ended',
          description: 'This auction has already ended',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to place bid. Please try again.',
          variant: 'destructive',
        });
      }
      
      return { success: false, error };
    }
    
    // Handle successful bid
    toast({
      title: 'Bid Placed',
      description: `Your bid of ${amount.toLocaleString()} PLN has been placed successfully`,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error placing bid:', error);
    toast({
      title: 'Error',
      description: 'An unexpected error occurred. Please try again.',
      variant: 'destructive',
    });
    return { success: false, error };
  }
};

export const cancelBid = async (bidId: string, dealerId: string) => {
  try {
    // Validate dealer owns this bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('id, dealer_id, status')
      .eq('id', bidId)
      .single();
      
    if (bidError) {
      toast({
        title: 'Error',
        description: 'Could not retrieve bid details',
        variant: 'destructive',
      });
      return { success: false, error: bidError };
    }
    
    if (bid.dealer_id !== dealerId) {
      toast({
        title: 'Unauthorized',
        description: 'You are not authorized to cancel this bid',
        variant: 'destructive',
      });
      return { success: false, error: 'Unauthorized' };
    }
    
    if (bid.status === 'accepted') {
      toast({
        title: 'Cannot Cancel',
        description: 'Cannot cancel an accepted bid',
        variant: 'destructive',
      });
      return { success: false, error: 'Cannot cancel accepted bid' };
    }
    
    // Cancel the bid
    const { error } = await supabase
      .from('bids')
      .update({ status: 'cancelled' })
      .eq('id', bidId);
      
    if (error) {
      console.error('Error cancelling bid:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel bid',
        variant: 'destructive',
      });
      return { success: false, error };
    }
    
    toast({
      title: 'Bid Cancelled',
      description: 'Your bid has been cancelled successfully',
    });
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error cancelling bid:', error);
    toast({
      title: 'Error',
      description: 'An unexpected error occurred',
      variant: 'destructive',
    });
    return { success: false, error };
  }
};
