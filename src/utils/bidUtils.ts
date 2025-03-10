
/**
 * Changes made:
 * - 2024-03-31: Created bidUtils file to handle bid operations
 * - 2024-03-31: Added placeBid function using RPC
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interface for bid data
export interface BidData {
  carId: string;
  dealerId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}

// Response interface for bid placement
export interface BidResponse {
  success: boolean;
  bidId?: string;
  amount?: number;
  error?: string;
  minimumBid?: number;
}

/**
 * Place a bid on a car
 * @param bidData The bid data
 * @returns Promise resolving to bid response
 */
export const placeBid = async (bidData: BidData): Promise<BidResponse> => {
  try {
    const { carId, dealerId, amount, isProxy = false, maxProxyAmount } = bidData;
    
    // For RPC calls, we need to use the correct function name without quotes
    const { data, error } = await supabase.rpc('place_bid', {
      p_car_id: carId,
      p_dealer_id: dealerId,
      p_amount: amount,
      p_is_proxy: isProxy,
      p_max_proxy_amount: maxProxyAmount
    });
    
    if (error) {
      console.error('Error placing bid:', error);
      toast.error(`Bid failed: ${error.message}`);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    // Function returns JSON with success, bid_id and amount
    return {
      success: data.success,
      bidId: data.bid_id,
      amount: data.amount,
      error: data.error,
      minimumBid: data.minimum_bid
    };
  } catch (error: any) {
    console.error('Exception placing bid:', error);
    toast.error(`Bid failed: ${error.message}`);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Cancel a bid
 * @param bidId The bid ID to cancel
 * @returns Promise resolving to success status
 */
export const cancelBid = async (bidId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bids')
      .update({ status: 'cancelled' })
      .eq('id', bidId);
      
    if (error) {
      console.error('Error cancelling bid:', error);
      toast.error(`Failed to cancel bid: ${error.message}`);
      return false;
    }
    
    toast.success('Bid cancelled successfully');
    return true;
  } catch (error: any) {
    console.error('Exception cancelling bid:', error);
    toast.error(`Failed to cancel bid: ${error.message}`);
    return false;
  }
};
