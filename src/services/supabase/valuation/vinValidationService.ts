
/**
 * Changes made:
 * - 2025-12-30: Created VIN validation service to interface with the validate-vin edge function
 */

import { supabase } from '@/integrations/supabase/client';

export interface VinValidationRequest {
  vin: string;
  mileage: number;
  userId?: string;
}

export interface VinValidationResponse {
  success: boolean;
  data?: {
    isValid?: boolean;
    vehicleExists?: boolean;
    reservationExists?: boolean;
    requiresValuation?: boolean;
    cached?: boolean;
    vin: string;
    mileage: number;
    make?: string;
    model?: string;
    year?: number;
    reservationId?: string;
    valuationData?: any;
  };
  error?: string;
  errorCode?: string;
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
