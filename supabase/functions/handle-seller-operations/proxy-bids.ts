
/**
 * Changes made:
 * - 2024-06-22: Extracted proxy bid processing functionality from operations.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';

export const processProxyBids = async (
  supabase: ReturnType<typeof createClient<Database>>,
  carId: string
) => {
  console.log(`Processing proxy bids for car: ${carId}`);
  
  try {
    // Get car details including current bid
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, current_bid, minimum_bid_increment, price, seller_id, auction_status')
      .eq('id', carId)
      .single();
    
    if (carError || !car) {
      console.error('Error fetching car details:', carError);
      return {
        success: false,
        error: carError?.message || 'Failed to fetch car details'
      };
    }
    
    // Verify the car is in an active auction
    if (car.auction_status !== 'active') {
      console.log('Car is not in an active auction, skipping proxy bid processing');
      return {
        success: true,
        message: 'Car is not in an active auction'
      };
    }
    
    // Get all proxy bids for this car, ordered by max_bid_amount in descending order
    const { data: proxyBids, error: proxyBidError } = await supabase
      .from('proxy_bids')
      .select('id, dealer_id, max_bid_amount')
      .eq('car_id', carId)
      .order('max_bid_amount', { ascending: false });
    
    if (proxyBidError) {
      console.error('Error fetching proxy bids:', proxyBidError);
      return {
        success: false,
        error: proxyBidError.message
      };
    }
    
    if (!proxyBids || proxyBids.length === 0) {
      console.log('No proxy bids found for this car');
      return {
        success: true,
        message: 'No proxy bids to process'
      };
    }
    
    console.log(`Found ${proxyBids.length} proxy bids for car ${carId}`);
    
    // Find the highest proxy bid (first in the array since we ordered by max_bid_amount desc)
    const highestProxyBid = proxyBids[0];
    
    // Current highest bid in the auction
    const currentBid = car.current_bid || car.price;
    const minBidIncrement = car.minimum_bid_increment || 100;
    
    // Calculate the next required bid amount
    const nextBidAmount = currentBid + minBidIncrement;
    
    // If highest proxy bid max amount is higher than the next bid amount required
    // AND the dealer who placed this proxy bid is not already the highest bidder
    // Check if highest bidder is the same as the proxy bid dealer
    const { data: currentHighBid, error: highBidError } = await supabase
      .from('bids')
      .select('dealer_id')
      .eq('car_id', carId)
      .eq('status', 'active')
      .single();
      
    if (highBidError && highBidError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error('Error checking current high bid:', highBidError);
      return {
        success: false,
        error: highBidError.message
      };
    }
    
    const currentHighBidDealerId = currentHighBid?.dealer_id;
    
    if (highestProxyBid.max_bid_amount >= nextBidAmount && 
        highestProxyBid.dealer_id !== currentHighBidDealerId) {
      
      // Use the database function to place the bid
      const { data: placeBidResult, error: placeBidError } = await supabase.rpc(
        'place_bid',
        {
          p_car_id: carId,
          p_dealer_id: highestProxyBid.dealer_id,
          p_amount: nextBidAmount,
          p_is_proxy: true,
          p_max_proxy_amount: highestProxyBid.max_bid_amount
        }
      );
      
      if (placeBidError) {
        console.error('Error placing proxy bid:', placeBidError);
        return {
          success: false,
          error: placeBidError.message
        };
      }
      
      console.log('Successfully placed proxy bid:', placeBidResult);
      return {
        success: true,
        data: {
          bidId: placeBidResult.bid_id,
          amount: placeBidResult.amount,
          dealerId: highestProxyBid.dealer_id
        }
      };
    } else {
      console.log('No eligible proxy bids to process at this time');
      // If the highest proxy bidder is already the current high bidder, or their max bid
      // is less than the next required bid amount, no action is needed
      return {
        success: true,
        message: 'No eligible proxy bids to process'
      };
    }
    
  } catch (error) {
    console.error('Error processing proxy bids:', error);
    return {
      success: false,
      error: error.message || 'Failed to process proxy bids'
    };
  }
};
