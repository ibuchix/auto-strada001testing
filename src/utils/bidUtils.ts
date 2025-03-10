
/**
 * Changes made:
 * - 2024-03-31: Created bidUtils file to handle bid operations
 * - 2024-03-31: Added placeBid function using RPC
 * - 2024-04-01: Fixed RPC function call to use fetch with proper URL
 * - 2024-04-02: Fixed access to protected Supabase client properties
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

// Supabase URL and key constants
const SUPABASE_URL = "https://sdvakfhmoaoucmhbhwvy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkdmFrZmhtb2FvdWNtaGJod3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ3OTI1OTEsImV4cCI6MjA1MDM2ODU5MX0.wvvxbqF3Hg_fmQ_4aJCqISQvcFXhm-2BngjvO6EHL0M";

// Interface for bid data
export interface BidData {
  carId: string;
  dealerId: string;
  amount: number;
  isProxy?: boolean;
  maxProxyAmount?: number;
}

// Response interface for bid placement
export interface BidResponse {
  success: boolean;
  bidId?: string;
  amount?: number;
  error?: string;
  minimumBid?: number;
}

/**
 * Place a bid on a car
 * @param bidData The bid data
 * @returns Promise resolving to bid response
 */
export const placeBid = async (bidData: BidData): Promise<BidResponse> => {
  try {
    const { carId, dealerId, amount, isProxy = false, maxProxyAmount } = bidData;
    
    // Call the stored procedure via fetch to the Supabase REST API
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/place_bid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          p_car_id: carId,
          p_dealer_id: dealerId,
          p_amount: amount,
          p_is_proxy: isProxy,
          p_max_proxy_amount: maxProxyAmount
        }),
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API error placing bid:', errorData);
      toast.error(`Bid failed: ${errorData.message || 'Unknown error'}`);
      return { 
        success: false, 
        error: errorData.message || 'Failed to place bid' 
      };
    }
    
    const data = await response.json();
    
    return {
      success: data.success,
      bidId: data.bid_id,
      amount: data.amount,
      error: data.error,
      minimumBid: data.minimum_bid
    };
  } catch (error: any) {
    console.error('Exception placing bid:', error);
    toast.error(`Bid failed: ${error.message}`);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Cancel a bid
 * @param bidId The bid ID to cancel
 * @returns Promise resolving to success status
 */
export const cancelBid = async (bidId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bids')
      .update({ status: 'cancelled' })
      .eq('id', bidId);
      
    if (error) {
      console.error('Error cancelling bid:', error);
      toast.error(`Failed to cancel bid: ${error.message}`);
      return false;
    }
    
    toast.success('Bid cancelled successfully');
    return true;
  } catch (error: any) {
    console.error('Exception cancelling bid:', error);
    toast.error(`Failed to cancel bid: ${error.message}`);
    return false;
  }
};
