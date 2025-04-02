
/**
 * Cache handler for handle-seller-operations edge function
 * Provides cache storage and retrieval capabilities
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from '../_shared/index.ts';

/**
 * Handle cache valuation request
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
  try {
    const { vin, mileage, valuation_data } = data;
    
    logOperation('cache_valuation_request', { 
      requestId, 
      vin, 
      mileage 
    });
    
    // Store in cache table
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
}

/**
 * Handle get cached valuation request
 */
export async function handleGetCachedValuationRequest(
  supabase: SupabaseClient,
  data: {
    vin: string;
    mileage: number;
  },
  requestId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { vin, mileage } = data;
    
    logOperation('get_cached_valuation_request', { 
      requestId, 
      vin, 
      mileage 
    });
    
    // Retrieve from cache table with mileage flexibility (5%)
    const { data: cacheData, error } = await supabase
      .from('vin_valuation_cache')
      .select('valuation_data, created_at')
      .eq('vin', vin)
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
        vin 
      });
      
      return {
        success: false,
        error: 'No cached valuation found'
      };
    }
    
    logOperation('get_cached_valuation_hit', { 
      requestId, 
      vin, 
      created_at: cacheData.created_at
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
}
