
/**
 * Changes made:
 * - 2024-04-04: Fixed parameter format for supabase function calls
 */

import { supabase } from "@/integrations/supabase/client";
import { generateRequestId } from "./utils/debug-utils";

/**
 * Store valuation data in cache
 */
export async function storeValuationInCache(vin: string, mileage: number, data: any) {
  try {
    const requestId = generateRequestId();
    console.log(`[CacheAPI][${requestId}] Storing valuation in cache:`, {
      vin,
      mileage,
      timestamp: new Date().toISOString()
    });

    // Call the RPC function
    const { data: result, error } = await supabase.rpc(
      'store_vin_valuation_cache',
      {
        p_vin: vin,
        p_mileage: mileage,
        p_valuation_data: data,
        p_log_id: requestId
      }
    );

    if (error) {
      console.error(`[CacheAPI][${requestId}] Cache store error:`, error);
      return false;
    }

    console.log(`[CacheAPI][${requestId}] Successfully stored in cache:`, {
      result,
      timestamp: new Date().toISOString()
    });

    return true;
  } catch (e) {
    console.error('Failed to store valuation in cache:', e);
    return false;
  }
}

/**
 * Get cached valuation data
 */
export async function getCachedValuation(vin: string, mileage: number) {
  try {
    const requestId = generateRequestId();
    console.log(`[CacheAPI][${requestId}] Checking cache for valuation:`, {
      vin,
      mileage,
      timestamp: new Date().toISOString()
    });

    // Call the RPC function
    const { data, error } = await supabase.rpc(
      'get_vin_valuation_cache',
      {
        p_vin: vin,
        p_mileage: mileage,
        p_log_id: requestId
      }
    );

    if (error) {
      console.error(`[CacheAPI][${requestId}] Cache retrieval error:`, error);
      return null;
    }

    if (!data) {
      console.log(`[CacheAPI][${requestId}] No cached data found`);
      return null;
    }

    console.log(`[CacheAPI][${requestId}] Found cached data:`, {
      dataFound: !!data,
      timestamp: new Date().toISOString()
    });

    return data;
  } catch (e) {
    console.error('Failed to retrieve cached valuation:', e);
    return null;
  }
}
