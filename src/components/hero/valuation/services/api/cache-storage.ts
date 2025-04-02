
/**
 * Changes made:
 * - 2024-04-15: Initial implementation of cache storage service
 * - 2024-10-17: Fixed permission errors by using security definer function
 * - 2024-10-17: Added robust error handling and fallback mechanisms
 * - 2024-11-15: Implemented multiple cache storage methods with fallbacks
 * - 2024-07-05: Fixed edge function error handling in fallback cache storage
 * - 2024-07-07: Completely isolated cache errors to prevent blocking main user flow
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logDetailedError } from "./utils/debug-utils";
import { valuationCacheService } from "@/services/supabase/valuation/cacheService";

/**
 * Store valuation data in the cache table for future use
 * Cache operations are completely isolated and will never block the main flow
 */
export const storeValuationInCache = async (
  vin: string,
  mileage: number,
  data: any
): Promise<boolean> => {
  console.log("Caching valuation data for VIN:", vin);
  
  try {
    // Use the cache service which employs multiple fallback mechanisms
    try {
      const success = await valuationCacheService.storeInCache(vin, mileage, data);
      
      if (!success) {
        // If the main approach failed, try fallback but don't let it block
        fallbackCacheStorage(vin, mileage, data).catch(err => {
          console.log("Fallback cache failed silently, continuing main flow:", err);
        });
      }
    } catch (error) {
      console.log("Primary cache failed silently, continuing main flow:", error);
      // Attempt fallback but don't wait for it or let it block
      fallbackCacheStorage(vin, mileage, data).catch(err => {
        console.log("Fallback cache also failed silently, continuing main flow:", err);
      });
    }
    
    // Always return true - cache operations should never block the main flow
    return true;
  } catch (error) {
    console.error("Error in cache storage flow:", error);
    logDetailedError("Exception in cache storage flow", error);
    
    // Always return true even on error - caching is non-critical
    return true;
  }
};

/**
 * Fallback approach using edge function to store data
 * This is completely isolated and will never throw errors to callers
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
      console.log("Edge function cache error - continuing main flow:", error);
      logDetailedError("Edge function cache error", error);
      // Return true anyway - don't let cache failures block the main flow
      return true;
    }
    
    console.log("Fallback cache storage successful");
    return true;
  } catch (error) {
    console.log("Exception in fallback cache storage - continuing main flow:", error);
    logDetailedError("Fallback cache storage exception", error);
    
    // Always return true - we've tried our best
    // This is a cache, so functionality should continue even if caching fails
    return true;
  }
};

/**
 * Retrieve valuation data from cache with multiple fallbacks
 * This is completely isolated and will never throw errors to callers
 */
export const getValuationFromCache = async (
  vin: string, 
  mileage: number
): Promise<any | null> => {
  console.log("Attempting to retrieve cached valuation for VIN:", vin);
  
  try {
    // Try using the primary cache service which has its own fallbacks
    const cachedData = await valuationCacheService.getFromCache(vin, mileage);
    
    if (cachedData) {
      console.log("Cache hit: Retrieved valuation data from cache service");
      return cachedData;
    }
    
    // If primary cache service fails, try additional fallbacks
    try {
      console.log("Attempting secondary cache retrieval mechanism");
      
      const { data, error } = await supabase.functions.invoke("handle-seller-operations", {
        body: {
          operation: "get_cached_valuation",
          vin,
          mileage
        }
      });
      
      if (!error && data && data.success) {
        console.log("Cache hit: Retrieved valuation data from edge function");
        return data.data;
      }
    } catch (fallbackError) {
      console.log("Secondary cache retrieval failed silently:", fallbackError);
    }
    
    console.log("Cache miss: No valuation data found for VIN:", vin);
    return null;
  } catch (error) {
    console.log("Exception in cache retrieval - continuing main flow:", error);
    logDetailedError("Cache retrieval exception", error);
    
    // Return null on any error - again, caching is non-critical
    return null;
  }
};
