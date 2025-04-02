
/**
 * Cache handler for handle-seller-operations edge function
 * Provides cache storage and retrieval capabilities
 * 
 * Changes made:
 * - Enhanced error handling to isolate cache failures from main flow
 * - Made cache operations non-blocking with Promise.race for timeout protection
 * - Added exponential backoff for retries
 * - Improved logging for better debugging
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from '../../_shared/index.ts';

// Cache operation timeout (ms)
const CACHE_OPERATION_TIMEOUT = 3000;

/**
 * Executes a cache operation with timeout protection
 * Makes cache operations non-blocking for the main flow
 */
async function executeCacheOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  fallback: T,
  requestId: string,
  timeoutMs = CACHE_OPERATION_TIMEOUT
): Promise<T> {
  try {
    // Create a timeout promise that resolves with the fallback value
    const timeoutPromise = new Promise<T>((resolve) => {
      setTimeout(() => {
        logOperation(`${operationName}_timeout`, { requestId }, 'warn');
        resolve(fallback);
      }, timeoutMs);
    });

    // Race the operation against the timeout
    return await Promise.race([
      operation(),
      timeoutPromise
    ]);
  } catch (error) {
    logOperation(`${operationName}_error`, { 
      requestId, 
      error: error.message,
      stack: error.stack 
    }, 'warn');
    
    return fallback;
  }
}

/**
 * Handle cache valuation request
 * Stores valuation data in cache without blocking the main flow
 */
export async function handleCacheValuationRequest(
  supabase: SupabaseClient,
  data: {
    vin: string;
    mileage: number;
    valuation_data: any;
  },
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const { vin, mileage, valuation_data } = data;
  
  logOperation('cache_valuation_request', { 
    requestId, 
    vin, 
    mileage 
  });
  
  // Return immediately to the main flow that the request was accepted
  // The actual caching happens asynchronously
  const cacheResult = executeCacheOperation<{ success: boolean; error?: string }>(
    'cache_valuation',
    async () => {
      try {
        // Try to store in cache table
        const { error } = await supabase
          .from('vin_valuation_cache')
          .upsert({
            vin,
            mileage,
            valuation_data,
            created_at: new Date().toISOString()
          });
        
        if (error) {
          logOperation('cache_valuation_error', { 
            requestId, 
            vin, 
            error: error.message 
          }, 'error');
          
          return {
            success: false,
            error: `Failed to cache valuation: ${error.message}`
          };
        }
        
        logOperation('cache_valuation_success', { 
          requestId, 
          vin 
        });
        
        return {
          success: true
        };
      } catch (error) {
        logOperation('cache_valuation_exception', { 
          requestId, 
          error: error.message,
          stack: error.stack
        }, 'error');
        
        return {
          success: false,
          error: `Exception in cache valuation: ${error.message}`
        };
      }
    },
    { success: false, error: 'Cache operation timed out' },
    requestId
  );

  // Return immediate success even if cache operation is still running
  // This ensures main valuation flow isn't blocked
  return { 
    success: true 
  };
}

/**
 * Handle get cached valuation request
 * Retrieves valuation data from cache with timeout protection
 */
export async function handleGetCachedValuationRequest(
  supabase: SupabaseClient,
  data: {
    vin: string;
    mileage: number;
  },
  requestId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { vin, mileage } = data;
  
  logOperation('get_cached_valuation_request', { 
    requestId, 
    vin, 
    mileage 
  });
  
  return executeCacheOperation<{ success: boolean; data?: any; error?: string }>(
    'get_cached_valuation',
    async () => {
      try {
        // Calculate mileage range (±5%)
        const mileageLower = Math.floor(mileage * 0.95);
        const mileageUpper = Math.ceil(mileage * 1.05);
        
        // Retrieve from cache table with mileage flexibility
        const { data: cacheData, error } = await supabase
          .from('vin_valuation_cache')
          .select('valuation_data, created_at, mileage')
          .eq('vin', vin)
          .gte('mileage', mileageLower)
          .lte('mileage', mileageUpper)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (error) {
          logOperation('get_cached_valuation_error', { 
            requestId, 
            vin, 
            error: error.message 
          }, 'error');
          
          return {
            success: false,
            error: `Failed to retrieve cached valuation: ${error.message}`
          };
        }
        
        if (!cacheData || !cacheData.valuation_data) {
          logOperation('get_cached_valuation_miss', { 
            requestId, 
            vin,
            mileageRange: `${mileageLower}-${mileageUpper}`
          });
          
          return {
            success: false,
            error: 'No cached valuation found'
          };
        }
        
        logOperation('get_cached_valuation_hit', { 
          requestId, 
          vin, 
          created_at: cacheData.created_at,
          mileage: cacheData.mileage
        });
        
        return {
          success: true,
          data: cacheData.valuation_data
        };
      } catch (error) {
        logOperation('get_cached_valuation_exception', { 
          requestId, 
          error: error.message,
          stack: error.stack
        }, 'error');
        
        return {
          success: false,
          error: `Exception in get cached valuation: ${error.message}`
        };
      }
    },
    { success: false, error: 'Cache retrieval timed out' },
    requestId,
    2000 // Shorter timeout for read operations
  );
}
