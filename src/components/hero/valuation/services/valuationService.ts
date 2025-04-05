
/**
 * Changes made:
 * - Enhanced error handling with better logging
 * - Added correlation ID support for request tracing
 * - Updated API calls to use the improved cache functions
 * - 2024-04-04: Fixed spread operator issue by checking for null values
 * - 2024-04-04: Added null/undefined object protection for all spreads
 * - 2025-05-08: Fixed missing utility function imports
 */

import { supabase } from "@/integrations/supabase/client";
import { getCachedValuation, storeValuationInCache } from "./api/cache-api";
import { generateRequestId, createPerformanceTracker } from "./api/utils/debug-utils";

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
    const tracker = createPerformanceTracker('valuation', requestId);
    tracker.checkpoint('start');
    
    const cachedData = await getCachedValuation(vin, mileage);
    tracker.checkpoint('cache-check');
    
    if (cachedData) {
      const result = {
        success: true,
        data: {
          ...(cachedData && typeof cachedData === 'object' ? cachedData : {}), // Ensure cachedData is an object before spreading
          vin,
          mileage,
          transmission: gearbox,
          fromCache: true
        }
      };
      
      tracker.complete('success', { fromCache: true });
      return result;
    }
    
    // No cache hit, call the edge function
    console.log(`[ValuationService][${requestId}] Cache miss, fetching from edge function`);
    tracker.checkpoint('edge-function-start');
    
    const { data: functionResult, error } = await supabase.functions.invoke('handle-car-listing', {
      body: { 
        vin, 
        mileage, 
        gearbox,
        correlationId
      }
    });
    
    tracker.checkpoint('edge-function-complete');
    
    if (error) {
      console.error(`[ValuationService][${requestId}] Edge function error:`, {
        message: error.message,
        details: error.details,
        correlationId,
        elapsedMs: (performance.now() - startTime).toFixed(2),
        timestamp: new Date().toISOString()
      });
      
      tracker.complete('failure', { error: error.message });
      
      return {
        success: false,
        data: { error: error.message, correlationId }
      };
    }
    
    // Store the result in the cache to avoid future API calls
    if (functionResult) {
      tracker.checkpoint('cache-store-start');
      
      try {
        await storeValuationInCache(vin, mileage, functionResult);
        tracker.checkpoint('cache-store-complete');
      } catch (cacheError) {
        tracker.checkpoint('cache-store-failed');
        // Log but don't fail the operation due to cache errors
        console.warn(`[ValuationService][${requestId}] Cache storage failed:`, {
          error: cacheError.message,
          correlationId,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    console.log(`[ValuationService][${requestId}] Valuation completed in ${(performance.now() - startTime).toFixed(2)}ms`);
    
    tracker.complete('success');
    
    return {
      success: true,
      data: {
        ...(functionResult && typeof functionResult === 'object' ? functionResult : {}), // Ensure functionResult is an object before spreading
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
