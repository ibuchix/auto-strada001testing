
/**
 * Vehicle existence checking functionality
 */
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "../_shared/index.ts";

export async function checkVehicleExists(
  supabase: SupabaseClient, 
  vin: string, 
  requestId: string
) {
  try {
    logOperation('vehicle_check_started', { requestId, vin });
    
    const { data, error } = await supabase
      .from('cars')
      .select('id, is_draft')
      .eq('vin', vin)
      .is('is_draft', false)
      .maybeSingle();
    
    if (error) {
      logOperation('vehicle_check_error', { 
        requestId, 
        vin, 
        error: error.message 
      }, 'error');
      return { exists: false, error: error.message };
    }
    
    const exists = !!data;
    
    logOperation('vehicle_check', { requestId, vin, exists });
    
    return { exists, carData: data };
  } catch (error) {
    logOperation('vehicle_check_exception', { 
      requestId, 
      vin, 
      error: error.message,
      stack: error.stack
    }, 'error');
    return { exists: false, error: error.message };
  }
}
