
/**
 * Changes made:
 * - 2024-07-22: Created dedicated handler for VIN validation requests
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { logOperation } from "../../_shared/index.ts";
import { checkVehicleExists } from "../vehicle-checker.ts";
import { getValuationFromAPI } from "./valuation-api.ts";

/**
 * Handle VIN validation requests
 */
export async function handleVinValidationRequest(
  supabase: SupabaseClient,
  data: {
    vin: string;
    mileage: number;
    gearbox: string;
    userId: string;
  },
  requestId: string
) {
  // First check if this car already exists in our database
  const vehicleExists = await checkVehicleExists(
    supabase, 
    data.vin, 
    data.mileage,
    requestId
  );
  
  if (vehicleExists) {
    logOperation('vin_already_exists', { 
      requestId, 
      vin: data.vin 
    });
    
    return {
      success: false,
      error: "A vehicle with this VIN already exists in our system",
      code: "VIN_EXISTS"
    };
  }
  
  // If not found, proceed with valuation API call
  return await getValuationFromAPI(data.vin, data.mileage, data.gearbox, requestId);
}
