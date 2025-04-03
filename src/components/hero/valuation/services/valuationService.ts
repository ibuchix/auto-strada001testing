
/**
 * Changes made:
 * - Enhanced error handling with better logging
 * - Added correlation ID support for request tracing
 * - Updated API calls to use the improved cache functions
 * - 2024-04-04: Fixed spread operator issue by checking for null values
 */

import { supabase } from "@/integrations/supabase/client";
import { getCachedValuation, storeValuationInCache } from "./api/cache-api";
import { generateRequestId, logApiCall } from "./api/utils/debug-utils";

export async function getValuation(
  vin: string,
  mileage: number,
  gearbox: string,
  correlationId?: string
) {
  const startTime = performance.now();
  const requestId = generateRequestId();
  correlationId = correlationId || crypto.randomUUID();
  
  console.log(`[ValuationService][${requestId}] Processing valuation request:`, {
    vin,
    mileage,
    gearbox,
    correlationId,
    timestamp: new Date().toISOString()
  });
  
  try {
    // First check cache
    const apiCall = logApiCall('cache_check', { vin, mileage, correlationId }, requestId);
    const cachedData = await getCachedValuation(vin, mileage);
    
    if (cachedData) {
      const result = {
        success: true,
        data: {
          ...(cachedData || {}), // Ensure cachedData is an object before spreading
          vin,
          mileage,
          transmission: gearbox,
          fromCache: true
        }
      };
      
      apiCall.complete(result);
      return result;
    }
    
    apiCall.complete({ cacheResult: 'miss' });
    
    // No cache hit, call the edge function
    console.log(`[ValuationService][${requestId}] Cache miss, fetching from edge function`);
    const functionCall = logApiCall('edge_function', { vin, mileage, correlationId }, requestId);
    
    const { data: functionResult, error } = await supabase.functions.invoke('handle-car-listing', {
      body: { 
        vin, 
        mileage, 
        gearbox,
        correlationId
      }
    });
    
    if (error) {
      const errorResult = functionCall.complete(null, error);
      
      console.error(`[ValuationService][${requestId}] Edge function error:`, {
        message: error.message,
        details: error.details,
        correlationId,
        elapsedMs: (performance.now() - startTime).toFixed(2),
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        data: { error: error.message, correlationId }
      };
    }
    
    // Function executed successfully
    functionCall.complete(functionResult);
    
    // Store the result in the cache to avoid future API calls
    if (functionResult) {
      const cacheStore = logApiCall('cache_store', { vin, mileage, correlationId }, requestId);
      
      try {
        await storeValuationInCache(vin, mileage, functionResult);
        cacheStore.complete({ success: true });
      } catch (cacheError) {
        cacheStore.complete(null, cacheError);
        // Log but don't fail the operation due to cache errors
        console.warn(`[ValuationService][${requestId}] Cache storage failed:`, {
          error: cacheError.message,
          correlationId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log(`[ValuationService][${requestId}] Valuation completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    
    return {
      success: true,
      data: {
        ...(functionResult || {}), // Ensure functionResult is an object before spreading
        vin,
        mileage,
        transmission: gearbox
      }
    };
  } catch (error) {
    console.error(`[ValuationService][${requestId}] Unhandled error:`, {
      message: error.message,
      stack: error.stack,
      correlationId,
      elapsedMs: (performance.now() - startTime).toFixed(2),
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      data: { error: error.message, correlationId }
    };
  }
}

// Clean up any temporary data if needed
export function cleanupValuationData() {
  // Nothing to clean up at the moment
}
