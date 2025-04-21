
/**
 * Changes made:
 * - 2025-07-08: Removed usage of obsolete utils.ts, switched to modular imports from utils directory.
 * - Updated logging import.
 */
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { logOperation } from './utils/logging.ts';

/**
 * Checks if a vehicle with the given VIN already exists
 * 
 * @param supabase Supabase client
 * @param vin Vehicle Identification Number
 * @param mileage Current mileage of the vehicle
 * @param requestId Request ID for logging
 * @returns Boolean indicating if the vehicle exists
 */
export async function checkVehicleExists(
  supabase: SupabaseClient,
  vin: string,
  mileage: number,
  requestId: string
): Promise<boolean> {
  try {
    // Check if the VIN exists in the cars table (excluding drafts)
    const { data, error } = await supabase
      .from('cars')
      .select('id, is_draft')
      .eq('vin', vin)
      .is('is_draft', false)  // Only consider non-draft listings
      .maybeSingle();
    
    if (error) {
      logOperation('vehicle_check_error', { 
        requestId, 
        vin, 
        error: error.message 
      }, 'error');
      return false; // Assume it doesn't exist if there's an error
    }
    
    // If data exists and it's not a draft, the car exists
    const exists = !!data;
    
    logOperation('vehicle_check', { 
      requestId, 
      vin, 
      exists,
      mileage
    });
    
    return exists;
  } catch (error) {
    logOperation('vehicle_check_exception', { 
      requestId, 
      vin, 
      error: error.message,
      stack: error.stack
    }, 'error');
    return false;
  }
}
