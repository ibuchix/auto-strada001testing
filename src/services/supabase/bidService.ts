
/**
 * Service for managing auction bids
 */

import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

export interface BidResult {
  success: boolean;
  error?: string;
  bidId?: string;
  newBidAmount?: number;
}

export const bidService = {
  async placeBid(carId: string, amount: number, session: Session | null): Promise<BidResult> {
    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to place a bid"
      };
    }

    // First, get dealer profile
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (dealerError || !dealer) {
      return {
        success: false,
        error: "Only verified dealers can place bids"
      };
    }

    const dealerId = dealer.id;

    // Get current car data
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('current_bid, minimum_bid_increment, price, is_auction, auction_status')
      .eq('id', carId)
      .single();

    if (carError || !car) {
      return {
        success: false,
        error: "Car not found"
      };
    }

    // Validate auction status
    if (!car.is_auction || car.auction_status !== 'active') {
      return {
        success: false,
        error: "This vehicle is not available for bidding"
      };
    }

    // Validate bid amount
    const currentBid = car.current_bid || 0;
    const minimumIncrement = car.minimum_bid_increment || 100;
    const minimumBid = currentBid + minimumIncrement;

    if (amount < minimumBid) {
      return {
        success: false,
        error: `Minimum bid amount is ${minimumBid}`
      };
    }

    // Create bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        car_id: carId,
        dealer_id: dealerId,
        amount
      })
      .select()
      .single();

    if (bidError) {
      return {
        success: false,
        error: bidError.message
      };
    }

    // Update car with new current bid
    const { error: updateError } = await supabase
      .from('cars')
      .update({
        current_bid: amount
      })
      .eq('id', carId);

    if (updateError) {
      console.error('Failed to update car with new bid amount:', updateError);
      // We still return success since the bid was placed
    }

    return {
      success: true,
      bidId: bid.id,
      newBidAmount: amount
    };
  },

  async getBidsForCar(carId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        id,
        amount,
        created_at,
        dealers:dealer_id (
          dealership_name
        )
      `)
      .eq('car_id', carId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bids:', error);
      return [];
    }

    return data || [];
  },

  async getUserBids(session: Session | null): Promise<any[]> {
    if (!session?.user?.id) {
      return [];
    }

    // First, get dealer ID
    const { data: dealer, error: dealerError } = await supabase
      .from('dealers')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (dealerError || !dealer) {
      return [];
    }

    // Get bids
    const { data, error } = await supabase
      .from('bids')
      .select(`
        id,
        amount,
        created_at,
        status,
        cars:car_id (
          id,
          title,
          make,
          model,
          year,
          current_bid,
          images
        )
      `)
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bids:', error);
      return [];
    }

    return data || [];
  }
};
