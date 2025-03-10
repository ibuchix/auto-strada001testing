
/**
 * Changes made:
 * - 2024-06-13: Created bidUtils to handle atomic bid operations
 * - 2024-06-13: Implemented placeBid function using the SQL function
 */

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

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
 * Place a bid on a car using the atomic database function
 * @param bidData The bid data
 * @returns Promise resolving to bid response
 */
export const placeBid = async (bidData: BidData): Promise<BidResponse> => {
  try {
    const { carId, dealerId, amount, isProxy = false, maxProxyAmount } = bidData;
    
    // Call the stored procedure via RPC
    const { data, error } = await supabase.rpc('place_bid', {
      p_car_id: carId,
      p_dealer_id: dealerId,
      p_amount: amount,
      p_is_proxy: isProxy,
      p_max_proxy_amount: maxProxyAmount
    });
    
    if (error) {
      console.error('Error placing bid:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to place bid' 
      };
    }
    
    return {
      success: data.success,
      bidId: data.bid_id,
      amount: data.amount,
      error: data.error,
      minimumBid: data.minimum_bid
    };
  } catch (error: any) {
    console.error('Exception placing bid:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Calculate the minimum bid amount for a car
 * @param currentBid Current highest bid
 * @param startingPrice Starting price if no bids
 * @param increment Minimum bid increment (defaults to 100)
 * @returns The minimum bid amount
 */
export const calculateMinimumBid = (
  currentBid: number | null, 
  startingPrice: number,
  increment: number = 100
): number => {
  if (!currentBid || currentBid === 0) {
    return startingPrice;
  }
  return currentBid + increment;
};

/**
 * Format currency (PLN)
 * @param amount Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '0 PLN';
  return `${amount.toLocaleString()} PLN`;
};
