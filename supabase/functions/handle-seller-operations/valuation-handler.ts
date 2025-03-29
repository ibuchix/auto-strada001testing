
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ValuationRequest } from './schema-validation.ts';
import { checkExistingEntities, validateVinInput } from './services/validation-service.ts';
import { fetchVehicleValuation } from './valuation-service.ts';
import { logOperation } from './utils.ts';

export async function handleGetValuation(
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
    
    // Fetch valuation from external service
    const valuationResult = await fetchVehicleValuation(vin, mileage, gearbox, requestId);
    
    if (!valuationResult.success) {
      return {
        success: false,
        error: valuationResult.error || 'Failed to get valuation',
        errorCode: valuationResult.errorCode || 'VALUATION_ERROR'
      };
    }
    
    // Store in cache
    try {
      const { error: cacheError } = await supabase
        .from('vin_valuation_cache')
        .upsert({
          vin,
          mileage,
          valuation_data: valuationResult.data
        });
      
      if (cacheError) {
        logOperation('cache_store_error', { 
          requestId, 
          vin, 
          error: cacheError.message 
        }, 'warn');
      }
    } catch (cacheError) {
      logOperation('cache_store_exception', { 
        requestId, 
        vin, 
        error: cacheError.message 
      }, 'warn');
    }
    
    // Store in VIN reservations if not already present
    try {
      const { error: reservationError } = await supabase
        .from('vin_reservations')
        .insert({
          vin,
          user_id: userId,
          valuation_data: valuationResult.data,
          // Will expire after 24 hours (handled by default value in table)
        })
        .onConflict('vin')
        .ignore();
      
      if (reservationError) {
        logOperation('reservation_store_error', { 
          requestId, 
          vin, 
          error: reservationError.message 
        }, 'warn');
      }
    } catch (reservationError) {
      logOperation('reservation_store_exception', { 
        requestId, 
        vin, 
        error: reservationError.message 
      }, 'warn');
    }
    
    logOperation('valuation_request_complete', { 
      requestId, 
      vin,
      success: true
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
