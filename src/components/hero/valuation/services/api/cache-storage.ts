
/**
 * Changes made:
 * - 2025-04-27: Created cache storage module extracted from cache-api.ts
 */

import { supabase } from "@/integrations/supabase/client";
import { ValuationData } from "../../types";
import { getSessionDebugInfo } from "./utils/debug-utils";
import { attemptDirectInsert } from "./utils/direct-insert";

/**
 * Store valuation data in the cache using enhanced security definer function
 * with improved error handling and detailed logging
 */
export async function storeValuationCache(
  vin: string,
  mileage: number,
  valuationData: ValuationData
): Promise<boolean> {
  console.log('Attempting to store valuation in cache for VIN:', vin);
  
  try {
    // Get detailed session information for debugging
    const sessionInfo = await getSessionDebugInfo();
    console.log('Session info when storing cache:', sessionInfo);
    
    // Check if user is authenticated first - this will affect which approach we use
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session?.user;
    
    if (isAuthenticated) {
      console.log('User is authenticated, using primary caching approach');
      console.log('Authentication details:', {
        userId: sessionData?.session?.user.id,
        email: sessionData?.session?.user.email,
        tokenExpiry: sessionData?.session?.expires_at ? 
          new Date(sessionData.session.expires_at * 1000).toISOString() : 'unknown'
      });
    } else {
      console.log('User is not authenticated, will try security definer function');
    }
    
    // Generate a unique log ID for tracking this operation
    const logId = `cache_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    console.log('Operation tracking ID:', logId);
    
    // Try using the enhanced security definer function with improved error handling
    // Use a type assertion to handle the additional parameter
    console.log('Calling store_vin_valuation_cache RPC with params:', {
      vin,
      mileage,
      valuationData: JSON.stringify(valuationData).substring(0, 100) + '...',
      logId
    });
    
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'store_vin_valuation_cache',
      {
        p_vin: vin,
        p_mileage: mileage,
        p_valuation_data: valuationData,
        p_log_id: logId
      } as any  // Use type assertion to bypass TypeScript checking
    );
    
    if (rpcError) {
      console.error('Security definer function failed with error:', rpcError);
      
      // Log detailed information about the error for debugging
      console.error('Error details:', {
        message: rpcError.message,
        details: rpcError.details,
        hint: rpcError.hint,
        code: rpcError.code,
        stackTrace: new Error().stack
      });
      
      // If authenticated, attempt direct database insert as fallback
      if (isAuthenticated) {
        console.log('Attempting direct insert as authenticated user fallback');
        return await attemptDirectInsert(vin, mileage, valuationData);
      } else {
        console.log('Skipping cache storage - user not authenticated and security definer failed');
        return false;
      }
    }
    
    console.log('Successfully stored valuation in cache via security definer function:', rpcData);
    return true;
  } catch (error) {
    console.error('Unexpected error in storeValuationCache:', error);
    console.error('Stack trace:', new Error().stack);
    // Don't throw the error, just log it as this is a non-critical operation
    return false;
  }
}
