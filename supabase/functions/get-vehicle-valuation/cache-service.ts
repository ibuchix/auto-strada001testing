
/**
 * Service for caching valuation results
 * 
 * Changes:
 * - Fixed import path to use correct relative path format
 */
import { createSupabaseClient } from "../../_shared/client.ts";
import { logOperation } from "../../_shared/logging.ts";

/**
 * Check if valuation is already in cache
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param requestId Request ID for tracking
 * @returns Cached result or null
 */
export async function checkCache(vin: string, mileage: number, requestId: string): Promise<any> {
  try {
    // Log cache check
    logOperation('cache_check', { 
      requestId, 
      vin, 
      mileage 
    });
    
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Query cache table
    const { data, error } = await supabase
      .from('vin_valuation_cache')
      .select('*')
      .eq('vin', vin)
      .eq('mileage', mileage)
      .single();
    
    // Handle query error
    if (error) {
      if (error.code !== 'PGRST116') { // Not found error code
        logOperation('cache_error', { 
          requestId, 
          error: error.message,
          code: error.code
        }, 'error');
      }
      return null;
    }
    
    // Cache hit
    if (data) {
      logOperation('cache_hit', { 
        requestId, 
        vin, 
        mileage,
        cacheId: data.id
      });
      
      return data.valuation_data;
    }
    
    // Cache miss
    logOperation('cache_miss', { 
      requestId, 
      vin, 
      mileage 
    });
    
    return null;
  } catch (err) {
    // Log error and continue with API request
    logOperation('cache_error', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return null;
  }
}

/**
 * Store valuation result in cache
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param valuationData Valuation data to store
 * @param requestId Request ID for tracking
 */
export async function storeInCache(vin: string, mileage: number, valuationData: any, requestId: string): Promise<void> {
  try {
    // Log cache store attempt
    logOperation('cache_store', { 
      requestId, 
      vin, 
      mileage 
    });
    
    // Create Supabase client
    const supabase = createSupabaseClient();
    
    // Insert into cache table
    const { error } = await supabase
      .from('vin_valuation_cache')
      .insert({
        vin,
        mileage,
        valuation_data: valuationData
      });
    
    // Handle insert error
    if (error) {
      throw error;
    }
    
    // Log success
    logOperation('cache_store_success', { 
      requestId, 
      vin, 
      mileage 
    });
  } catch (err) {
    // Log error but don't fail the request
    logOperation('cache_store_error', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
  }
}
