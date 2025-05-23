
/**
 * Valuation handler for handle-seller-operations
 * Created: 2025-04-19
 * Updated: 2025-06-01 - Improved error handling for missing pricing data
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ValuationRequest } from '../schema-validation.ts';
import { checkExistingEntities, validateVinInput } from '../services/validation-service.ts';
import { fetchVehicleValuation } from '../valuation-service.ts';
import { logOperation } from '../utils/logging.ts';
import { formatResponse } from '../shared.ts';
import { OperationError } from '../error-handler.ts';

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
    
    // Ensure we have the necessary pricing data
    const data = valuationResult.data;
    if (!data.price_min || !data.price_med || !data.basePrice || !data.reservePrice) {
      logOperation('invalid_pricing_data', { 
        requestId, 
        vin,
        data
      }, 'error');
      
      throw new OperationError(
        'Missing required pricing data from valuation service',
        'PRICING_DATA_MISSING'
      );
    }
    
    // Log the reserve price calculation
    logOperation('reserve_price_calculation', { 
      requestId, 
      vin,
      basePrice: data.basePrice,
      reservePrice: data.reservePrice,
      price_min: data.price_min,
      price_med: data.price_med
    });
    
    return formatResponse.success(data);
  } catch (error) {
    // Log error details
    logOperation('valuation_handler_error', { 
      requestId, 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
      stack: error.stack
    }, 'error');
    
    // Return error response
    return formatResponse.error(
      error.message || 'Error processing valuation request',
      400,
      error.code || 'PROCESSING_ERROR'
    );
  }
}
