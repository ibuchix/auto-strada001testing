
/**
 * Changes made:
 * - 2025-04-06: Updated to use the centralized vehicle data service
 * - Simplified storage functions by delegating to vehicleDataService
 */

import { supabase } from '@/integrations/supabase/client';
import { VehicleData, storeVehicleData, getVehicleData, clearVehicleData } from '@/services/vehicleDataService';

export interface VinValidationRequest {
  vin: string;
  mileage: number;
  userId?: string;
}

export type { VehicleData };

export interface VinValidationResponse {
  success: boolean;
  data?: VehicleData & {
    isValid?: boolean;
    vehicleExists?: boolean;
    reservationExists?: boolean;
    requiresValuation?: boolean;
    reservationId?: string;
    valuationData?: any;
  };
  error?: string;
  errorCode?: string;
}

/**
 * Store validation data in localStorage with a standardized structure
 * Now delegates to the centralized vehicle data service
 */
export function storeValidationData(data: VehicleData) {
  return storeVehicleData(data);
}

/**
 * Retrieve validation data from localStorage
 * Now delegates to the centralized vehicle data service
 */
export function getStoredValidationData(): VehicleData | null {
  return getVehicleData();
}

/**
 * Clear validation data from localStorage
 * Now delegates to the centralized vehicle data service
 */
export function clearValidationData() {
  clearVehicleData();
}

/**
 * Validates a VIN against the Supabase Edge Function
 * 
 * @param params - Validation request parameters
 * @returns Promise with validation results
 */
export async function validateVin(params: VinValidationRequest): Promise<VinValidationResponse> {
  try {
    console.log('Validating VIN:', params.vin);
    
    const { data, error } = await supabase.functions.invoke<any>('validate-vin', {
      body: params
    });
    
    if (error) {
      console.error('VIN validation error:', error);
      return {
        success: false,
        error: error.message || 'Error validating VIN',
        errorCode: 'FUNCTION_ERROR'
      };
    }
    
    // If successful, store the data using our standardized storage service
    if (data) {
      const vehicleData: VehicleData = {
        vin: params.vin,
        mileage: params.mileage,
        make: data.make,
        model: data.model,
        year: data.year,
        transmission: data.transmission || 'manual',
        cached: data.cached,
        reservePrice: data.reservePrice || data.valuation,
        valuation: data.valuation || data.reservePrice,
        averagePrice: data.averagePrice || data.basePrice
      };

      storeValidationData(vehicleData);
    }
    
    // Return the data from the function call
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Unexpected error during VIN validation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error validating VIN',
      errorCode: 'UNEXPECTED_ERROR'
    };
  }
}

/**
 * Check if a VIN format is valid (basic check)
 * 
 * @param vin - Vehicle Identification Number to check
 * @returns Boolean indicating if format is valid
 */
export function isValidVinFormat(vin: string): boolean {
  // Basic validation - VINs should be 17 characters and contain only valid characters
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}
