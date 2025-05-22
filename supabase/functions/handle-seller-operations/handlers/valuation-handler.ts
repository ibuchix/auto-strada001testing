
/**
 * Valuation handler for handle-seller-operations
 * Created: 2025-04-19
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ValuationRequest } from '../schema-validation.ts';
import { checkExistingEntities, validateVinInput } from '../services/validation-service.ts';
import { fetchVehicleValuation } from '../valuation-service.ts';
import { logOperation } from '../utils/logging.ts';
import { formatResponse } from '../shared.ts';

export async function handleGetValuation(
  supabase: SupabaseClient,
  data: ValuationRequest,
  requestId: string
): Promise<Response> {
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
      return formatResponse.success(existingCheck.data);
    }
    
    if (existingCheck.isExistingVehicle) {
      logOperation('vehicle_already_exists', { requestId, vin });
      return formatResponse.error(
        'This vehicle has already been listed',
        400,
        'VEHICLE_ALREADY_EXISTS'
      );
    }
    
    // Fetch valuation from external service
    const valuationResult = await fetchVehicleValuation(vin, mileage, gearbox, requestId);
    
    if (!valuationResult.success) {
      return formatResponse.error(
        valuationResult.error || 'Failed to get valuation',
        400,
        valuationResult.errorCode || 'VALUATION_ERROR'
      );
    }
    
    // Ensure critical fields exist and are standardized
    const processedData = {
      ...valuationResult.data,
      make: valuationResult.data.make || '',
      model: valuationResult.data.model || '',
      year: valuationResult.data.year || valuationResult.data.productionYear,
      transmission: gearbox || valuationResult.data.transmission || 'manual',
      mileage: mileage,
      vin: vin,
      // Ensure consistent naming for price fields
      valuation: valuationResult.data.reservePrice || valuationResult.data.valuation,
      reservePrice: valuationResult.data.reservePrice || valuationResult.data.valuation,
      averagePrice: valuationResult.data.basePrice || valuationResult.data.averagePrice
    };
    
    // Log the processed data structure
    logOperation('processed_valuation_data', { 
      requestId, 
      vin,
      dataFields: Object.keys(processedData),
      hasMake: !!processedData.make,
      hasModel: !!processedData.model,
      hasYear: !!processedData.year
    });
    
    // Store in cache
    try {
      const { error: cacheError } = await supabase
        .from('vin_valuation_cache')
        .upsert({
          vin,
          mileage,
          valuation_data: processedData
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
          valuation_data: processedData,
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
    
    return formatResponse.success(processedData);
  } catch (error) {
    logOperation('valuation_request_error', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return formatResponse.error(
      error.message || 'An error occurred during valuation',
      400,
      error.code || 'VALUATION_PROCESSING_ERROR'
    );
  }
}
