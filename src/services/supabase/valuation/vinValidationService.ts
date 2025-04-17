
/**
 * Enhanced VIN Validation Service
 * 
 * Changes:
 * - Improved error handling in validateVin function
 * - Added retry logic for transient errors
 * - Enhanced logging for better diagnostics
 * - Added option to bypass existence check
 */

import { supabase } from "@/integrations/supabase/client";
import { VehicleData, storeVehicleData, getVehicleData, clearVehicleData } from "@/services/vehicleDataService";

export interface VinValidationRequest {
  vin: string;
  mileage: number;
  userId?: string;
  allowExisting?: boolean; // New parameter to bypass existence check
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
 * Validates a VIN against the Supabase Edge Function with retry logic
 * 
 * @param params - Validation request parameters
 * @param retryCount - Number of retries for transient errors (default: 2)
 * @returns Promise with validation results
 */
export async function validateVin(
  params: VinValidationRequest, 
  retryCount = 2
): Promise<VinValidationResponse> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  try {
    console.log(`[VIN Validation][${requestId}] Validating VIN:`, params.vin, {
      mileage: params.mileage,
      allowExisting: params.allowExisting,
      timestamp: new Date().toISOString()
    });
    
    const { data, error } = await supabase.functions.invoke<any>('validate-vin', {
      body: {
        ...params,
        requestId // Pass request ID for better tracing
      }
    });
    
    if (error) {
      console.error(`[VIN Validation][${requestId}] Error:`, error);
      
      // Check for specific error types that might be retryable
      const isRetryableError = 
        error.message?.includes('timeout') || 
        error.message?.includes('network') ||
        error.message?.includes('rate limit') ||
        error.status === 429 ||
        error.status === 503;
      
      // Retry logic for transient errors
      if (isRetryableError && retryCount > 0) {
        console.log(`[VIN Validation][${requestId}] Retrying (${retryCount} attempts left)...`);
        
        // Exponential backoff - wait longer between retries
        const backoffMs = Math.pow(2, 3 - retryCount) * 500;
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        
        return validateVin(params, retryCount - 1);
      }
      
      return {
        success: false,
        error: error.message || 'Error validating VIN',
        errorCode: error.code || 'FUNCTION_ERROR'
      };
    }
    
    // If successful, store the data using our standardized storage service
    if (data) {
      console.log(`[VIN Validation][${requestId}] Success:`, {
        make: data.make,
        model: data.model,
        year: data.year,
        cached: data.cached,
        vehicleExists: data.vehicleExists
      });
      
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
    console.error(`[VIN Validation][${requestId}] Unexpected error:`, error);
    
    // Retry logic for unexpected errors
    if (retryCount > 0) {
      console.log(`[VIN Validation][${requestId}] Retrying after unexpected error (${retryCount} attempts left)...`);
      
      // Exponential backoff - wait longer between retries
      const backoffMs = Math.pow(2, 3 - retryCount) * 500;
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      return validateVin(params, retryCount - 1);
    }
    
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
