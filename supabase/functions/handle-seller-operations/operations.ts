/**
 * Changes made:
 * - 2024-03-19: Added reserve price calculation logic
 * - 2024-03-19: Updated reserve price calculation to use correct formula and percentage tiers
 * - 2024-06-15: Updated API credentials and checksum calculation
 * - 2024-06-15: Fixed hash import to use crypto module instead of deprecated hash module
 * - 2024-06-16: Added processProxyBids function to handle automated bidding
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const getReservePercentage = (basePrice: number): number => {
  if (basePrice <= 15000) return 0.65;
  if (basePrice <= 20000) return 0.46;
  if (basePrice <= 30000) return 0.37;
  if (basePrice <= 50000) return 0.27;
  if (basePrice <= 60000) return 0.27;
  if (basePrice <= 70000) return 0.22;
  if (basePrice <= 80000) return 0.23;
  if (basePrice <= 100000) return 0.24;
  if (basePrice <= 130000) return 0.20;
  if (basePrice <= 160000) return 0.185;
  if (basePrice <= 200000) return 0.22;
  if (basePrice <= 250000) return 0.17;
  if (basePrice <= 300000) return 0.18;
  if (basePrice <= 400000) return 0.18;
  if (basePrice <= 500000) return 0.16;
  return 0.145; // 500,001+
};

const calculateReservePrice = (priceMin: number, priceMed: number): number => {
  // Calculate base price (Price X) as average of min and median prices
  const priceX = (priceMin + priceMed) / 2;
  
  // Get the appropriate percentage based on the price range
  const percentageY = getReservePercentage(priceX);
  
  // Calculate reserve price using the formula: PriceX - (PriceX × PercentageY)
  const reservePrice = priceX - (priceX * percentageY);
  
  // Round to nearest whole number since we're dealing with PLN
  return Math.round(reservePrice);
};

export const validateVin = async (
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  mileage: number,
  gearbox: string,
  userId: string
) => {
  console.log(`Validating VIN: ${vin} for user: ${userId}`);

  try {
    // Check if vehicle already exists
    const { data: existingVehicle } = await supabase
      .from('cars')
      .select('id')
      .eq('vin', vin)
      .single();

    if (existingVehicle) {
      console.log('Vehicle already exists in database');
      return {
        success: true,
        data: {
          isExisting: true,
          error: 'This vehicle has already been listed'
        }
      };
    }

    // Get valuation from external API
    const checksum = await calculateChecksum(vin);
    const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:AUTOSTRA/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    console.log('Fetching valuation data from:', valuationUrl);
    
    const response = await fetch(valuationUrl);
    const data = await response.json();

    if (!data.success) {
      console.error('Valuation API error:', data);
      throw new Error(data.message || 'Failed to get valuation');
    }

    // Calculate reserve price using the min and median prices from the API response
    const reservePrice = calculateReservePrice(
      data.price_min || data.price,  // Use price_min if available, fallback to price
      data.price_med || data.price   // Use price_med if available, fallback to price
    );

    console.log('Calculated reserve price:', reservePrice);

    // Create a reservation for this VIN
    const { data: reservation, error: reservationError } = await supabase
      .from('vin_reservations')
      .insert([
        {
          vin,
          user_id: userId,
          status: 'pending',
          valuation_data: {
            ...data,
            reservePrice,
            basePrice: (data.price_min + data.price_med) / 2
          }
        }
      ])
      .select()
      .single();

    if (reservationError) {
      console.error('Reservation error:', reservationError);
      throw reservationError;
    }

    return {
      success: true,
      data: {
        make: data.make,
        model: data.model,
        year: data.year,
        valuation: data.price,
        averagePrice: data.averagePrice,
        reservePrice,
        reservationId: reservation.id
      }
    };

  } catch (error) {
    console.error('VIN validation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to validate VIN'
    };
  }
};

export const processProxyBids = async (
  supabase: ReturnType<typeof createClient<Database>>,
  carId: string
) => {
  console.log(`Processing proxy bids for car: ${carId}`);
  
  try {
    // Get car details including current bid
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, current_bid, minimum_bid_increment, price, seller_id')
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

const calculateChecksum = async (vin: string): Promise<string> => {
  // Use the API credentials from the instructions
  const apiId = "AUTOSTRA";
  const apiSecret = "A4FTFH54C3E37P2D34A16A7A4V41XKBF";
  
  // Calculate the checksum as md5(api id + api secret key + vin)
  const encoder = new TextEncoder();
  const data = encoder.encode(apiId + apiSecret + vin);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};
