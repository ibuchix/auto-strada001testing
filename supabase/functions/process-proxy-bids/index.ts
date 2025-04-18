/**
 * Edge function for processing proxy bids
 * 
 * This function handles the automated bidding system by processing all pending proxy
 * bids for specified cars. It ensures proper transaction handling and
 * consistent bid state.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, getSupabaseClient, Database } from "./utils.ts";

interface ProcessProxyBidsRequest {
  carId?: string;
  processingMode?: 'single' | 'all';
  initiatedBy?: string;
}

interface ProxyBidResult {
  success: boolean;
  message?: string;
  data?: {
    processedBids?: number;
    carIds?: string[];
    bidsPlaced?: Array<{
      carId: string;
      dealerId: string;
      amount: number;
      maxAmount: number;
    }>;
  };
  error?: string;
}

// Apply CORS headers to all responses
const withCors = (response: Response): Response => {
  for (const [header, value] of Object.entries(corsHeaders)) {
    response.headers.set(header, value);
  }
  return response;
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return withCors(new Response(null, { status: 204 }));
  }

  try {
    const requestId = crypto.randomUUID();
    
    // Get request data
    const requestData: ProcessProxyBidsRequest = await req.json();
    const { carId, processingMode = 'single', initiatedBy } = requestData;

    console.log(`[${requestId}] Processing proxy bids request:`, {
      carId,
      processingMode,
      initiatedBy
    });

    // Initialize Supabase client
    const supabase = getSupabaseClient();
    
    // Process proxy bids based on mode
    let result: ProxyBidResult;
    
    if (processingMode === 'single' && carId) {
      // Process proxy bids for a single car
      result = await processCarProxyBids(supabase, carId, requestId);
    } else {
      // Process proxy bids for all active auctions
      result = await processAllProxyBids(supabase, requestId);
    }

    console.log(`[${requestId}] Proxy bid processing complete:`, result);
    
    // Return success response
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error processing proxy bids:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred processing proxy bids"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

/**
 * Process proxy bids for a single car
 */
async function processCarProxyBids(
  supabase: ReturnType<typeof getSupabaseClient>,
  carId: string,
  requestId: string
): Promise<ProxyBidResult> {
  try {
    console.log(`[${requestId}] Processing proxy bids for car: ${carId}`);
    
    // Get car details including current bid
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id, current_bid, minimum_bid_increment, price, seller_id, auction_status, auction_end_time')
      .eq('id', carId)
      .single();
    
    if (carError || !car) {
      console.error(`[${requestId}] Error fetching car details:`, carError);
      return {
        success: false,
        error: carError?.message || 'Failed to fetch car details'
      };
    }
    
    // Verify the car is in an active auction with a valid end time
    if (car.auction_status !== 'active' || !car.auction_end_time) {
      console.log(`[${requestId}] Car is not in an active auction, skipping proxy bid processing`);
      return {
        success: true,
        message: 'Car is not in an active auction'
      };
    }
    
    const now = new Date();
    const endTime = new Date(car.auction_end_time);
    
    // Don't process if auction has ended
    if (now > endTime) {
      console.log(`[${requestId}] Auction has ended, skipping proxy bid processing`);
      return {
        success: true,
        message: 'Auction has ended'
      };
    }
    
    // Get all proxy bids for this car, ordered by max_bid_amount in descending order
    const { data: proxyBids, error: proxyBidError } = await supabase
      .from('proxy_bids')
      .select('id, dealer_id, max_bid_amount, last_processed_amount')
      .eq('car_id', carId)
      .order('max_bid_amount', { ascending: false });
    
    if (proxyBidError) {
      console.error(`[${requestId}] Error fetching proxy bids:`, proxyBidError);
      return {
        success: false,
        error: proxyBidError.message
      };
    }
    
    if (!proxyBids || proxyBids.length === 0) {
      console.log(`[${requestId}] No proxy bids found for this car`);
      return {
        success: true,
        message: 'No proxy bids to process'
      };
    }
    
    console.log(`[${requestId}] Found ${proxyBids.length} proxy bids for car ${carId}`);
    
    // Find the highest proxy bid (first in the array since we ordered by max_bid_amount desc)
    const highestProxyBid = proxyBids[0];
    
    // Current highest bid in the auction
    const currentBid = car.current_bid || car.price;
    const minBidIncrement = car.minimum_bid_increment || 100;
    
    // Calculate the next required bid amount
    const nextBidAmount = currentBid + minBidIncrement;
    
    // Check if highest bidder is the same as the proxy bid dealer
    const { data: currentHighBid, error: highBidError } = await supabase
      .from('bids')
      .select('dealer_id')
      .eq('car_id', carId)
      .eq('status', 'active')
      .single();
      
    if (highBidError && highBidError.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error(`[${requestId}] Error checking current high bid:`, highBidError);
      // If no current high bid exists, we can still proceed with the proxy bid
      if (highBidError.code !== 'PGRST116') {
        return {
          success: false,
          error: highBidError.message
        };
      }
    }
    
    const currentHighBidDealerId = currentHighBid?.dealer_id;
    
    // Skip if the dealer already has the highest bid or if their max proxy bid is too low
    if (highestProxyBid.dealer_id === currentHighBidDealerId || 
        highestProxyBid.max_bid_amount < nextBidAmount) {
      console.log(`[${requestId}] No eligible proxy bids to process at this time`);
      return {
        success: true,
        message: 'No eligible proxy bids to process',
        data: {
          processedBids: 0
        }
      };
    }
    
    // Execute the bid as a transaction
    console.log(`[${requestId}] Processing proxy bid for dealer ${highestProxyBid.dealer_id}`);
    
    // Calculate actual bid amount to place - usually the minimum increment unless competing with another proxy bid
    let bidAmountToPlace = nextBidAmount;
    
    // Check if there's a second highest proxy bid from a different dealer
    const competingProxyBids = proxyBids.filter(
      bid => bid.dealer_id !== highestProxyBid.dealer_id
    );
    
    if (competingProxyBids.length > 0) {
      const secondHighestBid = competingProxyBids[0];
      
      // If second highest bid + increment is less than highest max, place a bid at that level
      if (secondHighestBid.max_bid_amount + minBidIncrement <= highestProxyBid.max_bid_amount) {
        bidAmountToPlace = Math.min(
          secondHighestBid.max_bid_amount + minBidIncrement,
          highestProxyBid.max_bid_amount
        );
      }
    }
    
    // Use the database function to place the bid
    const { data: placeBidResult, error: placeBidError } = await supabase.rpc(
      'place_bid',
      {
        p_car_id: carId,
        p_dealer_id: highestProxyBid.dealer_id,
        p_amount: bidAmountToPlace,
        p_is_proxy: true,
        p_max_proxy_amount: highestProxyBid.max_bid_amount
      }
    );
    
    if (placeBidError) {
      console.error(`[${requestId}] Error placing proxy bid:`, placeBidError);
      return {
        success: false,
        error: placeBidError.message
      };
    }
    
    // Update the last_processed_amount in the proxy_bids table
    await supabase
      .from('proxy_bids')
      .update({ 
        last_processed_amount: bidAmountToPlace,
        updated_at: new Date().toISOString()
      })
      .eq('id', highestProxyBid.id);
      
    console.log(`[${requestId}] Successfully placed proxy bid:`, placeBidResult);
    return {
      success: true,
      data: {
        processedBids: 1,
        bidsPlaced: [{
          carId,
          dealerId: highestProxyBid.dealer_id,
          amount: bidAmountToPlace,
          maxAmount: highestProxyBid.max_bid_amount
        }]
      }
    };
    
  } catch (error) {
    console.error(`[${requestId}] Error processing proxy bids:`, error);
    return {
      success: false,
      error: error.message || 'Failed to process proxy bids'
    };
  }
}

/**
 * Process proxy bids for all active auctions
 */
async function processAllProxyBids(
  supabase: ReturnType<typeof getSupabaseClient>,
  requestId: string
): Promise<ProxyBidResult> {
  try {
    console.log(`[${requestId}] Processing proxy bids for all active auctions`);
    
    // Find all active auctions
    const { data: activeAuctions, error: auctionsError } = await supabase
      .from('cars')
      .select('id')
      .eq('auction_status', 'active')
      .lt('auction_end_time', new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString()) // Only auctions ending within 24 hours
      .gt('auction_end_time', new Date().toISOString()); // Only auctions that haven't ended yet
    
    if (auctionsError) {
      console.error(`[${requestId}] Error fetching active auctions:`, auctionsError);
      return {
        success: false,
        error: auctionsError.message
      };
    }
    
    if (!activeAuctions || activeAuctions.length === 0) {
      console.log(`[${requestId}] No active auctions found`);
      return {
        success: true,
        message: 'No active auctions found',
        data: {
          processedBids: 0,
          carIds: []
        }
      };
    }
    
    console.log(`[${requestId}] Found ${activeAuctions.length} active auctions`);
    
    // Process each auction
    const carIds = activeAuctions.map(auction => auction.id);
    const results: Array<{success: boolean; carId: string; bids?: any}> = [];
    let totalProcessed = 0;
    const bidsPlaced: any[] = [];
    
    for (const auction of activeAuctions) {
      const result = await processCarProxyBids(supabase, auction.id, requestId);
      
      results.push({
        success: result.success,
        carId: auction.id,
        bids: result.data?.bidsPlaced
      });
      
      if (result.success && result.data?.processedBids) {
        totalProcessed += result.data.processedBids;
        
        if (result.data.bidsPlaced) {
          bidsPlaced.push(...result.data.bidsPlaced);
        }
      }
    }
    
    console.log(`[${requestId}] Completed processing all proxy bids. Total processed: ${totalProcessed}`);
    
    return {
      success: true,
      data: {
        processedBids: totalProcessed,
        carIds,
        bidsPlaced
      }
    };
    
  } catch (error) {
    console.error(`[${requestId}] Error processing all proxy bids:`, error);
    return {
      success: false,
      error: error.message || 'Failed to process proxy bids for all auctions'
    };
  }
}
