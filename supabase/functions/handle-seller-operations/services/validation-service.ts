
/**
 * Changes made:
 * - 2025-07-04: Created validation service for VIN data validation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../../_shared/database.types.ts';
import { 
  ValidationError, 
  logOperation
} from '../utils.ts';
import { checkVehicleExists } from '../vehicle-checker.ts';

/**
 * Validates the input parameters for VIN validation
 */
export function validateVinInput(
  vin: string,
  mileage: number,
  userId: string
): void {
  // Check input validity
  if (!vin || vin.length < 11) {
    throw new ValidationError('Invalid VIN format', 'INVALID_VIN_FORMAT');
  }
  
  if (!mileage || mileage < 0) {
    throw new ValidationError('Invalid mileage value', 'INVALID_MILEAGE');
  }
  
  if (!userId) {
    throw new ValidationError('User ID is required', 'MISSING_USER_ID');
  }
}

/**
 * Checks for existing vehicle and reservation data
 */
export async function checkExistingEntities(
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  userId: string,
  mileage: number,
  requestId: string
) {
  // Check for valid reservation
  const reservationCheck = await validateReservation(supabase, vin, userId);
  
  if (reservationCheck.valid && reservationCheck.reservation) {
    logOperation('using_existing_reservation', { 
      requestId, 
      vin, 
      reservationId: reservationCheck.reservation.id 
    });
    
    // Get the valuation data from the reservation
    const valuationData = reservationCheck.reservation.valuation_data;
    
    // If we have valid data in the existing reservation, return it
    if (valuationData && valuationData.make && valuationData.model && valuationData.year) {
      return {
        isExistingReservation: true,
        data: {
          make: valuationData.make,
          model: valuationData.model,
          year: valuationData.year,
          valuation: valuationData.price || valuationData.valuation,
          averagePrice: valuationData.averagePrice,
          reservePrice: valuationData.reservePrice,
          reservationId: reservationCheck.reservation.id
        }
      };
    }
  }

  // Check if vehicle already exists
  const vehicleExists = await checkVehicleExists(supabase, vin, mileage, requestId);
  if (vehicleExists) {
    return {
      isExistingVehicle: true,
      data: {
        isExisting: true,
        error: 'This vehicle has already been listed'
      }
    };
  }

  return { isExistingReservation: false, isExistingVehicle: false };
}

/**
 * Import this from reservation-service to prevent circular dependencies
 */
export async function validateReservation(
  supabase: ReturnType<typeof createClient<Database>>,
  vin: string,
  userId: string
): Promise<{ 
  valid: boolean; 
  reservation?: any; 
  error?: string; 
}> {
  const requestId = crypto.randomUUID();
  logOperation('validateReservation_start', { requestId, vin, userId });
  
  try {
    // Find active reservation for this VIN
    const { data: reservation, error } = await supabase
      .from('vin_reservations')
      .select('*')
      .eq('vin', vin)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) {
      logOperation('validateReservation_error', { requestId, vin, error: error.message }, 'error');
      return { valid: false, error: 'Database error checking reservation' };
    }
    
    // If no reservation exists
    if (!reservation) {
      logOperation('validateReservation_no_reservation', { requestId, vin }, 'warn');
      return { valid: false, error: 'No active reservation found for this VIN' };
    }
    
    // Check if reservation belongs to this user
    if (reservation.user_id !== userId) {
      logOperation('validateReservation_wrong_user', { 
        requestId, 
        vin, 
        reservationUserId: reservation.user_id, 
        requestUserId: userId 
      }, 'warn');
      return { valid: false, error: 'This VIN is reserved by another user' };
    }
    
    // Check if reservation has expired
    const now = new Date();
    const expiresAt = new Date(reservation.expires_at);
    
    if (now > expiresAt) {
      logOperation('validateReservation_expired', { 
        requestId, 
        vin, 
        expiresAt: reservation.expires_at 
      }, 'warn');
      return { valid: false, error: 'Reservation has expired' };
    }
    
    logOperation('validateReservation_success', { requestId, reservationId: reservation.id });
    return { valid: true, reservation };
  } catch (error) {
    logOperation('validateReservation_exception', { requestId, vin, error.message }, 'error');
    return { valid: false, error: 'Error validating reservation' };
  }
}
