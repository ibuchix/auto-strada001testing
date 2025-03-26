
/**
 * Service for managing auction bids
 */

import { supabase } from "@/integrations/supabase/client";
import { TransactionType } from "@/services/supabase/transactions/types";
import { toast } from "sonner";

interface PlaceBidParams {
  carId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}

interface BidResult {
  success: boolean;
  bidId?: string;
  error?: string;
}

export const placeBid = async ({
  carId,
  amount,
  isProxy = false,
  maxProxyAmount
}: PlaceBidParams): Promise<BidResult> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to place bids"
      };
    }
    
    // Get dealer profile for the user
    const { data: dealerData, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', user.id)
      .single();
      
    if (dealerError || !dealerData) {
      return {
        success: false,
        error: "You must have a dealer profile to place bids"
      };
    }
    
    // Check if car exists and is in an active auction
    const { data: carData, error: carError } = await supabase
      .from('cars')
      .select('id, auction_status, current_bid, minimum_bid_increment')
      .eq('id', carId)
      .single();
      
    if (carError || !carData) {
      return {
        success: false,
        error: "Car not found or auction not active"
      };
    }
    
    if (carData.auction_status !== 'active') {
      return {
        success: false,
        error: "This auction is not currently active"
      };
    }
    
    // Validate bid amount
    if (amount <= (carData.current_bid || 0)) {
      return {
        success: false,
        error: `Bid must be higher than current bid of ${carData.current_bid}`
      };
    }
    
    const expectedIncrement = carData.minimum_bid_increment || 100;
    if ((amount - (carData.current_bid || 0)) % expectedIncrement !== 0) {
      return {
        success: false,
        error: `Bid must be in increments of ${expectedIncrement}`
      };
    }
    
    // Place the bid
    const { data: bidData, error: bidError } = await supabase
      .from('bids')
      .insert({
        car_id: carId,
        dealer_id: dealerData.id,
        amount: amount,
        status: 'active'
      })
      .select()
      .single();
      
    if (bidError) {
      console.error("Bid error:", bidError);
      return {
        success: false,
        error: "Failed to place bid"
      };
    }
    
    // If this is a proxy bid, store the max amount
    if (isProxy && maxProxyAmount && maxProxyAmount > amount) {
      const { error: proxyError } = await supabase
        .from('proxy_bids')
        .insert({
          car_id: carId,
          dealer_id: dealerData.id,
          max_bid_amount: maxProxyAmount,
          last_processed_amount: amount
        });
        
      if (proxyError) {
        console.error("Proxy bid error:", proxyError);
        // We don't fail the whole operation if just the proxy part fails
        toast.warning("Your bid was placed, but proxy bidding may not work");
      }
    }
    
    // Update the car's current bid
    const { error: updateError } = await supabase
      .from('cars')
      .update({
        current_bid: amount
      })
      .eq('id', carId);
      
    if (updateError) {
      console.error("Car update error:", updateError);
      // Don't fail the operation if just the update fails
    }
    
    // Log bid metrics for analytics
    await supabase
      .from('bid_metrics')
      .insert({
        bid_id: bidData.id,
        success: true
      });
    
    return {
      success: true,
      bidId: bidData.id
    };
    
  } catch (error: any) {
    console.error("Bid placement error:", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred"
    };
  }
};
