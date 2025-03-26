
/**
 * Changes made:
 * - Improved type safety for RPC response
 * - Ensured proper export of placeBid function
 * - Added more robust type checking for bid responses
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
export const placeBid = async (carId: string, amount: number, userId: string): Promise<BidResponse> => {
  try {
    const { data, error } = await supabase.rpc('place_bid', {
      p_car_id: carId,
      p_amount: amount,
      p_dealer_id: userId
    });
    
    if (error) throw error;
    
    // Validate and convert the response to BidResponse
    const bidResponse: BidResponse = {
      success: data && typeof data === 'object' ? true : false,
      bid_id: typeof data === 'object' && 'bid_id' in data ? data.bid_id : undefined,
      amount: typeof data === 'object' && 'amount' in data ? data.amount : undefined,
      error: typeof data === 'object' && 'error' in data ? data.error : undefined
    };
    
    return bidResponse;
  } catch (error: any) {
    console.error('Error placing bid:', error);
    return {
      success: false,
      error: error.message || 'An error occurred while placing the bid'
    };
  }
};

// Optional helper function for structured bid submission
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

// Ensure the placeBid function is the default export as well
export default placeBid;
