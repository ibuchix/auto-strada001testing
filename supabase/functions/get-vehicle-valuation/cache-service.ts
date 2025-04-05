
/**
 * Cache service for vehicle valuations
 * Handles memory and database caching operations
 */

import { logOperation } from "../_shared/logging.ts";
import { memoryCache } from "../_shared/cache.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Database } from "../_shared/database.types.ts";

// Supabase client setup
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

/**
 * Check if a valuation is in cache (memory or database)
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param requestId Request ID for logging
 * @returns Cached data or null if not found
 */
export async function checkCache(vin: string, mileage: number, requestId: string): Promise<any> {
  // Check memory cache first (fastest)
  const cacheKey = `valuation:${vin}:${mileage}`;
  const cachedResult = memoryCache.get(cacheKey);
  
  if (cachedResult) {
    logOperation('valuation_cache_hit', { 
      requestId, 
      vin, 
      cacheKey,
      source: 'memory'
    });
    return cachedResult;
  }
  
  // Not in memory cache, try database cache
  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: dbCache, error: dbError } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data')
      .eq('vin', vin)
      .eq('mileage', mileage)
      .maybeSingle();
    
    if (dbError) {
      logOperation('db_cache_error', { 
        requestId, 
        vin, 
        error: dbError.message 
      }, 'warn');
      return null;
    }
    
    if (dbCache?.valuation_data) {
      // Found in database cache, store in memory cache for next time
      logOperation('valuation_cache_hit', { 
        requestId, 
        vin, 
        source: 'database'
      });
      
      // Store in memory cache for future requests
      memoryCache.set(cacheKey, dbCache.valuation_data);
      
      return dbCache.valuation_data;
    }
    
    // Not found in any cache
    return null;
  } catch (error) {
    logOperation('cache_check_error', { 
      requestId, 
      vin, 
      error: error.message 
    }, 'warn');
    return null;
  }
}

/**
 * Store valuation data in caches (memory and database)
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param data Valuation data to cache
 * @param requestId Request ID for logging
 */
export async function storeInCache(vin: string, mileage: number, data: any, requestId: string): Promise<void> {
  // Store in memory cache
  const cacheKey = `valuation:${vin}:${mileage}`;
  memoryCache.set(cacheKey, data);
  
  // Store in database cache
  try {
    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { error: dbError } = await supabase
      .from('vin_valuation_cache')
      .upsert({
        vin,
        mileage,
        valuation_data: data
      });
    
    if (dbError) {
      logOperation('db_cache_store_error', { 
        requestId, 
        vin, 
        error: dbError.message 
      }, 'warn');
    } else {
      logOperation('cache_stored', { 
        requestId, 
        vin,
        locations: ['memory', 'database']
      });
    }
  } catch (error) {
    logOperation('cache_store_error', { 
      requestId, 
      vin, 
      error: error.message 
    }, 'warn');
  }
}
