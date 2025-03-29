
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from './utils.ts';
import { BidResponse } from './types.ts';

export async function handleProxyBids(
  supabase: SupabaseClient,
  requestData: {
    operation: string;
    carId?: string;
    userId: string;
  }
): Promise<BidResponse> {
  const requestId = crypto.randomUUID();
  
  try {
    const { carId, userId } = requestData;
    
    if (!carId) {
      return {
        success: false,
        error: 'Car ID is required',
        message: 'Missing required parameter: carId'
      };
    }
    
    // Log operation start
    logOperation('proxy_bids_request', { requestId, carId, userId });
    
    // Get active proxy bids for this car
    const { data: bids, error } = await supabase
      .from('proxy_bids')
      .select('*')
      .eq('car_id', carId)
      .order('amount', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch proxy bids: ${error.message}`);
    }
    
    // Determine if the user has active bids
    const userBids = bids?.filter(bid => bid.dealer_id === userId) || [];
    
    // Get current car price for context
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('current_bid, minimum_bid_increment, auction_status, auction_end_time')
      .eq('id', carId)
      .single();
    
    if (carError) {
      throw new Error(`Failed to fetch car details: ${carError.message}`);
    }
    
    logOperation('proxy_bids_request_complete', { 
      requestId, 
      carId,
      bidCount: bids?.length || 0,
      userBidCount: userBids.length
    });
    
    return {
      success: true,
      data: {
        bids: userBids,
        car: {
          currentBid: car?.current_bid,
          minimumIncrement: car?.minimum_bid_increment,
          auctionStatus: car?.auction_status,
          auctionEndTime: car?.auction_end_time
        },
        totalBids: bids?.length || 0
      }
    };
  } catch (error) {
    logOperation('proxy_bids_request_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: error.message || 'An error occurred processing proxy bids',
      message: 'Failed to get proxy bid information'
    };
  }
}
