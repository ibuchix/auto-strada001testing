
/**
 * Changes made:
 * - 2024-10-25: Added missing placeBid export
 * - 2024-10-31: Fixed parameter names to match RPC function definition
 * - 2024-12-05: Improved type safety for bid response
 * - 2024-12-12: Fixed type conversion for RPC response data
 */

import { supabase } from "@/integrations/supabase/client";

// Define the response type for bid operations
export interface BidResponse {
  success: boolean;
  bid_id?: string;
  amount?: number;
  error?: string;
}

// Interface for the bid data argument
export interface BidData {
  carId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}

/**
 * Place a bid on a car auction
 * @param auctionId ID of the car being bid on
 * @param amount Bid amount in currency units
 * @param userId ID of the user placing the bid
 * @returns Promise with bid result information
 */
export const placeBid = async (auctionId: string, amount: number, userId: string): Promise<BidResponse> => {
  try {
    const { data, error } = await supabase.rpc('place_bid', {
      p_car_id: auctionId,
      p_amount: amount,
      p_dealer_id: userId
    });
    
    if (error) throw error;
    
    // Properly cast and validate the response
    if (data && typeof data === 'object') {
      // Type assertion after validation
      return data as BidResponse;
    }
    
    // Handle unexpected response format
    return {
      success: false,
      error: 'Invalid response format from server'
    };
  } catch (error: any) {
    console.error('Error placing bid:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while placing the bid'
    };
  }
};

/**
 * Place a bid using bid data object
 * @param bidData Object containing bid details
 * @returns Promise with bid result
 */
export const placeStructuredBid = async (bidData: BidData): Promise<BidResponse> => {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    
    if (!userId) {
      return {
        success: false,
        error: 'User must be logged in to place a bid'
      };
    }
    
    return placeBid(bidData.carId, bidData.amount, userId);
  } catch (error: any) {
    console.error('Error in structured bid placement:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while processing the bid'
    };
  }
};
