
/**
 * Changes made:
 * - 2024-04-15: Initial implementation of cache storage service
 * - 2024-10-17: Fixed permission errors by using security definer function
 * - 2024-10-17: Added robust error handling and fallback mechanisms
 * - 2024-07-05: Fixed edge function error handling in fallback cache storage
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logDetailedError } from "./utils/debug-utils";
import { valuationCacheService } from "@/services/supabase/valuation/cacheService";

/**
 * Store valuation data in the cache table for future use
 */
export const storeValuationInCache = async (
  vin: string,
  mileage: number,
  data: any
): Promise<boolean> => {
  console.log("Caching valuation data for VIN:", vin);
  
  try {
    // Use the cache service which employs a security definer function
    const success = await valuationCacheService.storeInCache(vin, mileage, data);
    
    if (!success) {
      // If the main approach failed, try fallback
      return await fallbackCacheStorage(vin, mileage, data);
    }
    
    return true;
  } catch (error) {
    console.error("Error storing valuation in cache:", error);
    logDetailedError("Exception in cache storage flow", error);
    
    // Try fallback approach
    return await fallbackCacheStorage(vin, mileage, data);
  }
};

/**
 * Fallback approach using edge function to store data
 */
const fallbackCacheStorage = async (
  vin: string,
  mileage: number,
  data: any
): Promise<boolean> => {
  console.log("Attempting fallback cache storage via edge function");
  
  try {
    // Call the edge function to handle caching with elevated permissions
    const { data: result, error } = await supabase.functions.invoke("handle-seller-operations", {
      body: {
        operation: "cache_valuation",
        vin,
        mileage,
        valuation_data: data,
      },
    });
    
    if (error) {
      console.error("Error in fallback cache storage:", error);
      logDetailedError("Edge function cache error", error);
      // Return true anyway - don't let cache failures block the main flow
      return true;
    }
    
    console.log("Fallback cache storage successful");
    return true;
  } catch (error) {
    console.error("Exception in fallback cache storage:", error);
    logDetailedError("Fallback cache storage exception", error);
    
    // Silent failure - we've tried our best
    // This is a cache, so functionality should continue even if caching fails
    return true;
  }
};
