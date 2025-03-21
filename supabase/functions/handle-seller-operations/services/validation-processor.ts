
/**
 * Changes made:
 * - 2025-07-04: Created processor for validation results
 */

import { 
  cacheValidation,
  logOperation 
} from '../utils.ts';
import { createVinReservation } from '../reservation-service.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../../_shared/database.types.ts';

/**
 * Processes a successful validation result
 */
export async function processValidationResult(
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  userId: string,
  valuationData: any,
  mileage: number,
  requestId: string
) {
  // Add any additional processing of validation data here
  
  // Cache the valuation data
  cacheValidation(vin, valuationData, mileage);

  // Create a reservation for this VIN
  const reservation = await createVinReservation(supabase, vin, userId, valuationData);

  logOperation('validateVin_success', {
    requestId,
    vin,
    reservationId: reservation.id,
    make: valuationData.make,
    model: valuationData.model,
    year: valuationData.year
  });

  return {
    success: true,
    data: {
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      valuation: valuationData.price,
      averagePrice: valuationData.averagePrice,
      reservePrice: valuationData.reservePrice,
      reservationId: reservation.id
    }
  };
}

/**
 * Handles validation errors with proper logging
 */
export function handleValidationError(error: any, vin: string, requestId: string) {
  // Enhanced error handling
  logOperation('validateVin_error', { 
    requestId,
    vin, 
    errorMessage: error.message,
    errorCode: error.code || 'UNKNOWN_ERROR',
    stack: error.stack
  }, 'error');
  
  if (error.code) {
    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
  
  return {
    success: false,
    error: error.message || 'Failed to validate VIN',
    errorCode: 'SYSTEM_ERROR'
  };
}
