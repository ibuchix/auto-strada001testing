
/**
 * Changes made:
 * - 2024-06-14: Updated to use the secure place_bid SQL function
 * - 2024-06-14: Added type assertions for proper TypeScript compatibility
 * - 2024-06-14: Improved error handling for bid operations
 */

import { supabase } from "@/integrations/supabase/client";

export interface BidData {
  carId: string;
  dealerId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}

export interface BidResponse {
  success: boolean;
  bid_id?: string;
  amount?: number;
  error?: string;
  minimumBid?: number;
}

/**
 * Calculates the minimum acceptable bid amount based on the current bid and increment
 */
export const calculateMinimumBid = (
  currentBid: number,
  minIncrement: number = 100,
  basePrice: number = 0
): number => {
  if (currentBid === 0) {
    return basePrice; // Initial bid must be at least the starting price
  }
  return currentBid + minIncrement;
};

/**
 * Places a bid using the secure place_bid function
 * This ensures all bid validation and conflict resolution happens atomically
 */
export const placeBid = async (data: BidData): Promise<BidResponse> => {
  try {
    // Call the place_bid function with proper parameters
    const { data: result, error } = await supabase.rpc(
      'place_bid' as any, 
      {
        p_car_id: data.carId,
        p_dealer_id: data.dealerId,
        p_amount: data.amount,
        p_is_proxy: data.isProxy || false,
        p_max_proxy_amount: data.maxProxyAmount || null
      }
    );

    if (error) {
      console.error('Bid placement error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // The function returns a JSON object with fields we need to extract
    const typedResult = result as unknown as {
      success: boolean;
      bid_id?: string;
      amount?: number;
      error?: string;
      minimum_bid?: number;
    };

    return {
      success: typedResult.success,
      bid_id: typedResult.bid_id,
      amount: typedResult.amount,
      error: typedResult.error,
      minimumBid: typedResult.minimum_bid
    };
  } catch (error: any) {
    console.error('Unexpected bid error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

/**
 * Function for admins to end an auction
 */
export const adminEndAuction = async (
  carId: string, 
  adminId: string, 
  markAsSold: boolean = true
): Promise<{success: boolean; error?: string; auction_status?: string}> => {
  try {
    const { data: result, error } = await supabase.rpc(
      'admin_end_auction' as any,
      {
        p_car_id: carId,
        p_admin_id: adminId,
        p_sold: markAsSold
      }
    );

    if (error) {
      console.error('End auction error:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Type the result properly
    const typedResult = result as unknown as {
      success: boolean;
      auction_status?: string;
      error?: string;
    };

    return {
      success: typedResult.success,
      auction_status: typedResult.auction_status,
      error: typedResult.error
    };
  } catch (error: any) {
    console.error('Unexpected end auction error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};
