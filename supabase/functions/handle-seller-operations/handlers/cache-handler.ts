
/**
 * Handler for cache-related operations
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from '../../_shared/logging.ts';
import { cacheValidation, getCachedValidation } from '../cache.ts';

export interface CacheResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function handleCacheOperations(
  supabase: SupabaseClient,
  operation: string,
  requestData: any,
  requestId: string
): Promise<CacheResult> {
  const { vin, mileage } = requestData;
  
  // Validate required fields
  if (!vin) {
    logOperation('cache_operation_error', {
      requestId,
      operation,
      error: 'Missing VIN parameter'
    }, 'error');
    
    return {
      success: false,
      error: "VIN is required"
    };
  }
  
  try {
    // Handle different cache operations
    switch (operation) {
      case 'cache_valuation': {
        // Make sure we have valuation data
        if (!requestData.valuation_data) {
          logOperation('cache_operation_error', {
            requestId,
            operation,
            error: 'Missing valuation_data parameter'
          }, 'error');
          
          return {
            success: false,
            error: "Valuation data is required"
          };
        }
        
        // Handle in-memory cache
        cacheValidation(vin, requestData.valuation_data, mileage);
        
        // Also store in database for persistence
        try {
          const { error } = await supabase.rpc(
            'store_vin_valuation_cache',
            {
              p_vin: vin,
              p_mileage: mileage || 0,
              p_valuation_data: requestData.valuation_data,
              p_log_id: requestId
            }
          );
          
          if (error) {
            logOperation('db_cache_store_error', {
              requestId,
              vin,
              error: error.message
            }, 'warn');
            
            // Try direct insertion/update as fallback
            const { error: directError } = await supabase
              .from('vin_valuation_cache')
              .upsert({
                vin,
                mileage: mileage || 0, 
                valuation_data: requestData.valuation_data
              });
              
            if (directError) {
              logOperation('direct_cache_store_error', {
                requestId,
                vin,
                error: directError.message
              }, 'warn');
            }
          }
        } catch (dbError) {
          // Log but continue since we already stored in memory cache
          logOperation('db_cache_store_exception', {
            requestId,
            vin,
            error: dbError.message
          }, 'warn');
        }
        
        logOperation('cache_store_complete', {
          requestId,
          vin,
          mileage
        });
        
        return {
          success: true,
          data: { cached: true }
        };
      }
        
      case 'get_cached_valuation': {
        // Check in-memory cache first
        const memoryCache = getCachedValidation(vin, mileage);
        
        if (memoryCache) {
          logOperation('memory_cache_hit', {
            requestId,
            vin
          });
          
          return {
            success: true,
            data: memoryCache
          };
        }
        
        // Try database cache
        try {
          const { data, error } = await supabase.rpc(
            'get_vin_valuation_cache',
            {
              p_vin: vin,
              p_mileage: mileage || 0,
              p_log_id: requestId
            }
          );
          
          if (!error && data) {
            // Store in memory cache for faster future access
            cacheValidation(vin, data, mileage);
            
            logOperation('db_cache_hit', {
              requestId,
              vin
            });
            
            return {
              success: true,
              data
            };
          }
          
          // Try direct query if RPC failed
          if (error) {
            logOperation('rpc_cache_error', {
              requestId,
              vin,
              error: error.message
            }, 'warn');
            
            const { data: directData, error: directError } = await supabase
              .from('vin_valuation_cache')
              .select('valuation_data')
              .eq('vin', vin)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
              
            if (!directError && directData?.valuation_data) {
              // Store in memory cache
              cacheValidation(vin, directData.valuation_data, mileage);
              
              logOperation('direct_db_cache_hit', {
                requestId,
                vin
              });
              
              return {
                success: true,
                data: directData.valuation_data
              };
            }
          }
        } catch (dbError) {
          logOperation('db_cache_query_exception', {
            requestId,
            vin,
            error: dbError.message
          }, 'warn');
        }
        
        // No cache hit anywhere
        logOperation('cache_miss', {
          requestId,
          vin
        });
        
        return {
          success: true,
          data: null
        };
      }
        
      default:
        return {
          success: false,
          error: "Unknown cache operation"
        };
    }
  } catch (error) {
    logOperation('cache_handler_error', {
      requestId,
      operation,
      vin,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: `Error handling cache operation: ${error.message}`
    };
  }
}
