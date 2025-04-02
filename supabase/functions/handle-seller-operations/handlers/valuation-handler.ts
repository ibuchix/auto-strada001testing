
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValuationRequest } from '../schema-validation.ts';
import { checkExistingEntities, validateVinInput } from '../services/validation-service.ts';
import { fetchVehicleValuation } from '../valuation-service.ts';
import { logOperation } from '../../_shared/index.ts';

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
  try {
    const { vin, mileage, gearbox, userId } = data;
    
    // Log operation start
    logOperation('valuation_request_start', { requestId, vin, mileage, gearbox, userId });
    
    // Validate inputs
    validateVinInput(vin, mileage, userId);
    
    // Check for existing data
    const existingCheck = await checkExistingEntities(supabase, vin, userId, mileage, requestId);
    
    if (existingCheck.isExistingReservation) {
      logOperation('using_existing_reservation', { requestId, vin });
      return {
        success: true,
        data: existingCheck.data
      };
    }
    
    if (existingCheck.isExistingVehicle) {
      logOperation('vehicle_already_exists', { requestId, vin });
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
      // Attempt to get cached valuation with a timeout to avoid blocking main flow
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
            reason: error.message 
          }, 'info');
          return null;
        });
      
      if (cacheResult?.data?.success && cacheResult?.data?.data) {
        logOperation('using_cached_valuation', { requestId, vin });
        cachedValuationResult = cacheResult.data.data;
      }
    } catch (cacheError) {
      // Log but continue with regular valuation flow
      logOperation('cache_lookup_error', { 
        requestId, 
        error: cacheError.message 
      }, 'warn');
    }
    
    // Use cached data if available or fetch from external service
    const valuationResult = cachedValuationResult || (await fetchVehicleValuation(vin, mileage, gearbox, requestId));
    
    if (!valuationResult.success) {
      return {
        success: false,
        error: valuationResult.error || 'Failed to get valuation',
        errorCode: valuationResult.errorCode || 'VALUATION_ERROR'
      };
    }
    
    // Store in cache asynchronously - don't await, fire and forget
    if (!cachedValuationResult) {
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
          error: error.message 
        }, 'warn');
      });
    }
    
    // Store in VIN reservations if not already present - also async
    try {
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
              error: result.error.message 
            }, 'warn');
          }
        })
        .catch(error => {
          logOperation('reservation_store_exception', { 
            requestId, 
            vin, 
            error: error.message 
          }, 'warn');
        });
    } catch (reservationError) {
      // Just log, don't affect main flow
      logOperation('reservation_store_exception', { 
        requestId, 
        vin, 
        error: reservationError.message 
      }, 'warn');
    }
    
    logOperation('valuation_request_complete', { 
      requestId, 
      vin,
      success: true,
      fromCache: !!cachedValuationResult
    });
    
    return {
      success: true,
      data: valuationResult.data
    };
  } catch (error) {
    logOperation('valuation_request_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: error.message || 'An error occurred during valuation',
      errorCode: error.code || 'VALUATION_PROCESSING_ERROR'
    };
  }
}
