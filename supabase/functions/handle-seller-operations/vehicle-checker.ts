
/**
 * Changes made:
 * - 2024-07-22: Extracted vehicle checking functionality from vin-validation.ts
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation, ValidationError, cacheValidation } from './utils.ts';

/**
 * Checks if a vehicle with the given VIN already exists in the database
 */
export async function checkVehicleExists(
  supabase: SupabaseClient,
  vin: string,
  mileage: number,
  requestId: string
): Promise<boolean> {
  const { data: existingVehicle, error: existingVehicleError } = await supabase
    .from('cars')
    .select('id')
    .eq('vin', vin)
    .single();

  if (existingVehicleError && existingVehicleError.code !== 'PGRST116') {
    logOperation('existing_vehicle_check_error', { 
      requestId,
      vin, 
      error: existingVehicleError.message 
    }, 'error');
    throw new ValidationError(
      'Error checking existing vehicle', 
      'DATABASE_ERROR'
    );
  }

  if (existingVehicle) {
    logOperation('vehicle_already_exists', { 
      requestId,
      vin, 
      vehicleId: existingVehicle.id 
    });
    
    // Cache this result
    cacheValidation(vin, { isExisting: true }, mileage);
    
    return true;
  }
  
  return false;
}
