/**
 * Changes made:
 * - 2024-10-25: Added missing placeBid export
 */

import { supabase } from "@/integrations/supabase/client";

// Export placeBid function for use in BidForm component
export const placeBid = async (auctionId: string, amount: number, userId: string) => {
  try {
    const { data, error } = await supabase.rpc('place_bid', {
      p_auction_id: auctionId,
      p_bid_amount: amount,
      p_bidder_id: userId
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};
