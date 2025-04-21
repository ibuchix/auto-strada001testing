/**
 * Valuation handler for seller operations
 * Updated: 2025-04-21 - Fixed import paths to use local utils instead of shared
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValuationRequest } from '../schema-validation.ts';
import { checkExistingEntities, validateVinInput } from '../services/validation-service.ts';
import { fetchVehicleValuation } from '../valuation-service.ts';
import { logOperation, createPerformanceTracker } from '../utils/logging.ts';

export async function handleValuationRequest(
  supabase: SupabaseClient,
  data: ValuationRequest,
  requestId: string
): Promise<{
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  errorCode?: string;
}> {
  // Create performance tracker for monitoring execution times
  const perfTracker = createPerformanceTracker(requestId, 'valuation_request');
  
  try {
    const { vin, mileage, gearbox, userId } = data;
    
    // Log operation start with detailed context
    logOperation('valuation_request_start', { 
      requestId, 
      vin, 
      mileage, 
      gearbox, 
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Validate inputs
    validateVinInput(vin, mileage, userId);
    perfTracker.checkpoint('input_validation');
    
    // Check for existing data
    const existingCheckStartTime = performance.now();
    const existingCheck = await checkExistingEntities(supabase, vin, userId, mileage, requestId);
    perfTracker.checkpoint('existing_check');
    
    logOperation('existing_entities_check', { 
      requestId, 
      vin,
      isExistingReservation: existingCheck.isExistingReservation,
      isExistingVehicle: existingCheck.isExistingVehicle,
      executionTimeMs: (performance.now() - existingCheckStartTime).toFixed(2),
      timestamp: new Date().toISOString()
    });
    
    if (existingCheck.isExistingReservation) {
      logOperation('using_existing_reservation', { 
        requestId, 
        vin,
        timestamp: new Date().toISOString(),
        dataFields: existingCheck.data ? Object.keys(existingCheck.data) : []
      });
      
      // Ensure data has consistent property names
      if (existingCheck.data) {
        // Make sure both valuation and reservePrice exist (for backwards compatibility)
        if (existingCheck.data.valuation !== undefined && existingCheck.data.reservePrice === undefined) {
          existingCheck.data.reservePrice = existingCheck.data.valuation;
        } else if (existingCheck.data.reservePrice !== undefined && existingCheck.data.valuation === undefined) {
          existingCheck.data.valuation = existingCheck.data.reservePrice;
        }
      }
      
      perfTracker.complete('success', { 
        source: 'existing_reservation', 
        vin, 
        mileage 
      });
      
      return {
        success: true,
        data: existingCheck.data
      };
    }
    
    if (existingCheck.isExistingVehicle) {
      logOperation('vehicle_already_exists', { 
        requestId, 
        vin,
        timestamp: new Date().toISOString()
      });
      
      perfTracker.complete('failure', { 
        reason: 'vehicle_already_exists', 
        vin 
      });
      
      return {
        success: false,
        data: existingCheck.data,
        error: 'This vehicle has already been listed',
        errorCode: 'VEHICLE_ALREADY_EXISTS'
      };
    }
    
    // Try to get cached valuation first (non-blocking)
    let cachedValuationResult = null;
    try {
      // Log cache lookup attempt
      logOperation('cache_lookup_start', { 
        requestId, 
        vin,
        mileage,
        timestamp: new Date().toISOString()
      });
      
      // Attempt to get cached valuation with a timeout to avoid blocking main flow
      const cacheStartTime = performance.now();
      const cachePromise = supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'get_cached_valuation',
          vin,
          mileage
        }
      });
      
      // Set a timeout to ensure non-blocking behavior
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cache lookup timed out')), 1500);
      });
      
      // Race the cache lookup against the timeout
      const cacheResult = await Promise.race([cachePromise, timeoutPromise])
        .catch(error => {
          logOperation('cache_lookup_skip', { 
            requestId, 
            reason: error.message,
            duration: (performance.now() - cacheStartTime).toFixed(2) + 'ms',
            timestamp: new Date().toISOString()
          }, 'info');
          return null;
        });
      
      perfTracker.checkpoint('cache_lookup');
      
      if (cacheResult?.data?.success && cacheResult?.data?.data) {
        logOperation('using_cached_valuation', { 
          requestId, 
          vin,
          cacheLookupTimeMs: (performance.now() - cacheStartTime).toFixed(2),
          dataKeys: Object.keys(cacheResult.data.data),
          timestamp: new Date().toISOString()
        });
        
        cachedValuationResult = cacheResult.data.data;
        
        // Ensure consistent property names in cached data
        if (cachedValuationResult.valuation !== undefined && cachedValuationResult.reservePrice === undefined) {
          cachedValuationResult.reservePrice = cachedValuationResult.valuation;
        } else if (cachedValuationResult.reservePrice !== undefined && cachedValuationResult.valuation === undefined) {
          cachedValuationResult.valuation = cachedValuationResult.reservePrice;
        }
      }
    } catch (cacheError) {
      // Log but continue with regular valuation flow
      logOperation('cache_lookup_error', { 
        requestId, 
        error: cacheError.message,
        stack: cacheError.stack,
        timestamp: new Date().toISOString()
      }, 'warn');
    }
    
    // Use cached data if available or fetch from external service
    let valuationResult;
    if (cachedValuationResult) {
      valuationResult = {
        success: true,
        data: cachedValuationResult
      };
      perfTracker.checkpoint('using_cached_data');
    } else {
      // Log external API request start
      logOperation('external_valuation_start', { 
        requestId, 
        vin,
        mileage,
        gearbox,
        timestamp: new Date().toISOString()
      });
      
      // Time the external API call
      const apiStartTime = performance.now();
      valuationResult = await fetchVehicleValuation(vin, mileage, gearbox, requestId);
      const apiCallDuration = performance.now() - apiStartTime;
      
      perfTracker.checkpoint('external_api_call');
      
      // Log external API result
      logOperation('external_valuation_result', { 
        requestId, 
        vin,
        success: valuationResult.success,
        error: valuationResult.error || null,
        durationMs: apiCallDuration.toFixed(2),
        timestamp: new Date().toISOString()
      });
    }
    
    if (!valuationResult.success) {
      perfTracker.complete('failure', { 
        reason: valuationResult.errorCode || 'valuation_error', 
        error: valuationResult.error 
      });
      
      return {
        success: false,
        error: valuationResult.error || 'Failed to get valuation',
        errorCode: valuationResult.errorCode || 'VALUATION_ERROR'
      };
    }
    
    // Ensure consistent property names in API response
    if (valuationResult.data) {
      // Make sure both valuation and reservePrice exist
      if (valuationResult.data.valuation !== undefined && valuationResult.data.reservePrice === undefined) {
        valuationResult.data.reservePrice = valuationResult.data.valuation;
      } else if (valuationResult.data.reservePrice !== undefined && valuationResult.data.valuation === undefined) {
        valuationResult.data.valuation = valuationResult.data.reservePrice;
      }
    }
    
    // Store in cache asynchronously - don't await, fire and forget
    if (!cachedValuationResult) {
      // Log cache store attempt
      logOperation('cache_store_start', { 
        requestId, 
        vin,
        timestamp: new Date().toISOString()
      }, 'debug');
      
      // Fire and forget - don't block the main flow
      supabase.functions.invoke('handle-seller-operations', {
        body: {
          operation: 'cache_valuation',
          vin,
          mileage,
          valuation_data: valuationResult.data
        }
      }).catch(error => {
        // Just log the error, don't let it affect the main flow
        logOperation('cache_store_error', { 
          requestId, 
          error: error.message,
          timestamp: new Date().toISOString()
        }, 'warn');
      });
    }
    
    // Store in VIN reservations if not already present - also async
    try {
      // Log reservation attempt
      logOperation('creating_vin_reservation', { 
        requestId, 
        vin,
        userId,
        timestamp: new Date().toISOString()
      }, 'debug');
      
      // Fire and forget - don't await the result
      supabase
        .from('vin_reservations')
        .insert({
          vin,
          user_id: userId,
          valuation_data: valuationResult.data,
          // Will expire after 24 hours (handled by default value in table)
        })
        .onConflict('vin')
        .ignore()
        .then(result => {
          if (result.error) {
            logOperation('reservation_store_error', { 
              requestId, 
              vin, 
              error: result.error.message,
              timestamp: new Date().toISOString()
            }, 'warn');
          }
        })
        .catch(error => {
          logOperation('reservation_store_exception', { 
            requestId, 
            vin, 
            error: error.message,
            timestamp: new Date().toISOString()
          }, 'warn');
        });
    } catch (reservationError) {
      // Just log, don't affect main flow
      logOperation('reservation_store_exception', { 
        requestId, 
        vin, 
        error: reservationError.message,
        timestamp: new Date().toISOString()
      }, 'warn');
    }
    
    perfTracker.complete('success', { 
      source: cachedValuationResult ? 'cache' : 'external_api',
      vin,
      hasData: !!valuationResult.data,
      dataFields: valuationResult.data ? Object.keys(valuationResult.data) : []
    });
    
    logOperation('valuation_request_complete', { 
      requestId, 
      vin,
      success: true,
      fromCache: !!cachedValuationResult,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      data: valuationResult.data
    };
  } catch (error) {
    perfTracker.complete('error', { 
      errorType: error.constructor?.name,
      errorMessage: error.message
    });
    
    logOperation('valuation_request_error', { 
      requestId, 
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, 'error');
    
    return {
      success: false,
      error: error.message || 'An error occurred during valuation',
      errorCode: error.code || 'VALUATION_PROCESSING_ERROR'
    };
  }
}
