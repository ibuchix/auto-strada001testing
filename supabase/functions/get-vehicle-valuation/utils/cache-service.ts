
/**
 * Cache service utilities for get-vehicle-valuation
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { logOperation } from './logging.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Get Supabase client instance
 */
export function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if a valuation exists in cache
 * @param vin Vehicle identification number
 * @param requestId For logging
 * @returns Cached data or null if not found
 */
export async function checkCache(vin: string, requestId: string): Promise<any> {
  try {
    const supabase = getSupabaseClient();
    
    // Get cache TTL from env or use default (6 hours)
    const cacheTtlHours = parseInt(Deno.env.get('VALUATION_CACHE_TTL_HOURS') || '6');
    const cacheTtlMillis = cacheTtlHours * 60 * 60 * 1000;
    
    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data, created_at')
      .eq('vin', vin)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (cacheError) {
      logOperation('cache_check_error', { 
        requestId, 
        vin,
        error: cacheError.message
      }, 'warn');
      return null;
    }
    
    if (!cachedData) {
      logOperation('cache_miss', { 
        requestId, 
        vin
      });
      return null;
    }
    
    // Check if cache entry is expired
    const cacheDate = new Date(cachedData.created_at);
    const now = new Date();
    const ageMillis = now.getTime() - cacheDate.getTime();
    
    if (ageMillis > cacheTtlMillis) {
      logOperation('cache_expired', { 
        requestId, 
        vin,
        ageHours: (ageMillis / (60 * 60 * 1000)).toFixed(2),
        maxAgeHours: cacheTtlHours
      });
      return null;
    }
    
    logOperation('cache_hit', { 
      requestId, 
      vin,
      ageHours: (ageMillis / (60 * 60 * 1000)).toFixed(2),
      cachedAt: cachedData.created_at
    });
    
    return cachedData.valuation_data;
  } catch (error) {
    logOperation('cache_check_exception', { 
      requestId, 
      vin,
      error: error.message
    }, 'error');
    return null;
  }
}

/**
 * Store valuation data in cache
 * @param vin Vehicle identification number
 * @param valuationData Data to store
 * @param requestId For logging
 */
export async function storeInCache(vin: string, valuationData: any, requestId: string): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('vin_valuation_cache')
      .upsert({
        vin,
        valuation_data: valuationData,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'vin' 
      });
    
    if (error) {
      logOperation('cache_store_error', { 
        requestId, 
        vin,
        error: error.message
      }, 'warn');
      return;
    }
    
    logOperation('cache_store_success', { 
      requestId, 
      vin
    });
  } catch (error) {
    logOperation('cache_store_exception', { 
      requestId, 
      vin,
      error: error.message
    }, 'error');
  }
}
