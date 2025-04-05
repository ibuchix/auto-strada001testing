
/**
 * Changes made:
 * - 2024-07-22: Created dedicated handler for proxy bids requests
 * - 2025-04-05: Updated to use consistent Supabase client version
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logOperation } from "../../_shared/index.ts";

/**
 * Handle proxy bids processing requests
 */
export async function handleProxyBidsRequest(
  supabase: SupabaseClient,
  data: {
    carId: string;
  },
  requestId: string
) {
  // Call RPC function to process proxy bids
  const { data: proxyResult, error: proxyError } = await supabase
    .rpc('process_pending_proxy_bids');
    
  if (proxyError) {
    logOperation('process_proxy_bids_error', { 
      requestId, 
      error: proxyError.message 
    }, 'error');
    
    return {
      success: false,
      error: "Failed to process proxy bids: " + proxyError.message
    };
  }
  
  logOperation('process_proxy_bids_success', { 
    requestId, 
    result: proxyResult 
  });
  
  return {
    success: true,
    processingResult: proxyResult
  };
}
