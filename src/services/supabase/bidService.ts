
/**
 * Changes made:
 * - Improved type safety for RPC response
 * - Ensured proper export of placeBid function
 * - Added more robust type checking for bid responses
 * - Fixed type conversion issues for RPC responses
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

// Define the RPC response structure to help with type conversion
interface PlaceBidRpcResponse {
  bid_id?: string | null;
  amount?: number | null;
  error?: string | null;
}

/**
 * Place a bid on a car auction
 * @param carId ID of the car being bid on
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
    
    // Validate and convert the response to BidResponse with proper type handling
    const rpcResponse = data as PlaceBidRpcResponse | null;
    
    const bidResponse: BidResponse = {
      success: !!rpcResponse && typeof rpcResponse === 'object',
      bid_id: rpcResponse && 'bid_id' in rpcResponse ? String(rpcResponse.bid_id || '') : undefined,
      amount: rpcResponse && 'amount' in rpcResponse && typeof rpcResponse.amount === 'number' ? 
        rpcResponse.amount : undefined,
      error: rpcResponse && 'error' in rpcResponse ? String(rpcResponse.error || '') : undefined
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
