
/**
 * Edge function for processing proxy bids
 * Updated: 2025-04-19 - Improved error handling and response formatting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  corsHeaders, 
  logOperation, 
  formatSuccessResponse, 
  formatErrorResponse,
  formatServerErrorResponse
} from "./utils/index.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  logOperation('process_proxy_bids_request', { requestId });

  try {
    const { listingId } = await req.json();

    if (!listingId) {
      logOperation('missing_listing_id', { requestId }, 'error');
      return formatErrorResponse('Listing ID is required', 400);
    }

    logOperation('processing_proxy_bids', { requestId, listingId });

    // Fetch proxy bids for the listing
    const { data: proxyBids, error: proxyBidsError } = await supabase
      .from('proxy_bids')
      .select('*')
      .eq('listing_id', listingId)
      .order('bid_amount', { ascending: false });

    if (proxyBidsError) {
      logOperation('fetch_proxy_bids_error', { requestId, listingId, error: proxyBidsError.message }, 'error');
      return formatErrorResponse(`Failed to fetch proxy bids: ${proxyBidsError.message}`, 500);
    }

    if (!proxyBids || proxyBids.length === 0) {
      logOperation('no_proxy_bids_found', { requestId, listingId });
      return formatSuccessResponse({ message: 'No proxy bids found for this listing' });
    }

    // Determine the winning bid (highest bid amount)
    const winningBid = proxyBids[0];

    // Update the listing with the winning bid
    const { error: updateListingError } = await supabase
      .from('cars')
      .update({
        price: winningBid.bid_amount,
        buyer_id: winningBid.user_id,
        status: 'sold'
      })
      .eq('id', listingId);

    if (updateListingError) {
      logOperation('update_listing_error', { requestId, listingId, error: updateListingError.message }, 'error');
      return formatErrorResponse(`Failed to update listing with winning bid: ${updateListingError.message}`, 500);
    }

    logOperation('listing_updated_with_winning_bid', { requestId, listingId, winningBid });

    return formatSuccessResponse({
      message: 'Proxy bids processed successfully',
      winningBid
    });

  } catch (error) {
    logOperation('process_proxy_bids_exception', { requestId, error: error.message }, 'error');
    return formatServerErrorResponse(`Error processing proxy bids: ${error.message}`, 500);
  }
});
