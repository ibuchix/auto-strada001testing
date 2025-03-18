
/**
 * Changes made:
 * - 2024-06-14: Updated to use the secure place_bid SQL function
 * - 2024-06-14: Added type assertions for proper TypeScript compatibility
 * - 2024-06-14: Improved error handling for bid operations
 * - 2024-10-24: Fixed type issues with the transaction system
 */

import { supabase } from "@/integrations/supabase/client";
import { transactionService, TransactionType, TransactionOptions } from "@/services/supabase/transactionService";

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
export const placeBid = async ({
  carId,
  dealerId,
  amount,
  isProxy = false,
  maxProxyAmount
}: {
  carId: string;
  dealerId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}): Promise<BidResponse> => {
  // Use the transaction service to track this critical operation
  return transactionService.executeTransaction<BidResponse>(
    "Place Bid",
    TransactionType.AUCTION,
    async () => {
      const { data, error } = await supabase.rpc('place_bid', {
        p_car_id: carId,
        p_dealer_id: dealerId,
        p_amount: amount,
        p_is_proxy: isProxy,
        p_max_proxy_amount: maxProxyAmount
      });

      if (error) {
        throw new Error(error.message);
      }

      const typedData = data as unknown as BidResponse;
      
      if (!typedData.success) {
        throw new Error(typedData.error || 'Failed to place bid');
      }

      // Add transaction-specific metadata
      const transactionId = crypto.randomUUID();
      transactionService.updateTransactionMetadata(transactionId, {
        bidAmount: amount,
        isProxy,
        maxProxyAmount,
        carId,
        bidId: typedData.bid_id
      });

      return typedData;
    },
    {
      description: `Bid of ${amount} PLN ${isProxy ? '(Proxy)' : ''}`,
      showToast: true,
      retryCount: isProxy ? 0 : 1, // Only retry manual bids, not proxy bids
      metadata: {
        carId,
        bidAmount: amount,
        isProxy
      }
    } as TransactionOptions
  );
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
