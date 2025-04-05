
/**
 * Changes made:
 * - Enhanced localStorage storage with consistent data structure
 * - Added standardized data format for vehicle information
 * - Implemented utility functions for data storage and retrieval
 */

import { supabase } from '@/integrations/supabase/client';

export interface VinValidationRequest {
  vin: string;
  mileage: number;
  userId?: string;
}

export interface VehicleData {
  vin: string;
  mileage: number;
  make?: string;
  model?: string;
  year?: number;
  transmission?: 'manual' | 'automatic';
  engineCapacity?: number;
  cached?: boolean;
  reservePrice?: number;
  valuation?: number;
  averagePrice?: number;
}

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
 */
export function storeValidationData(data: VehicleData) {
  if (!data || !data.vin) {
    console.error('Cannot store invalid validation data', data);
    return false;
  }

  try {
    // Store the complete data object
    localStorage.setItem('valuationData', JSON.stringify(data));
    
    // Also store individual fields for backward compatibility
    if (data.vin) localStorage.setItem('tempVIN', data.vin);
    if (data.mileage) localStorage.setItem('tempMileage', data.mileage.toString());
    if (data.transmission) localStorage.setItem('tempGearbox', data.transmission);
    
    // Store timestamp
    localStorage.setItem('valuationTimestamp', new Date().toISOString());
    
    console.log('Stored validation data in localStorage:', data);
    return true;
  } catch (error) {
    console.error('Failed to store validation data:', error);
    return false;
  }
}

/**
 * Retrieve validation data from localStorage
 */
export function getStoredValidationData(): VehicleData | null {
  try {
    const dataString = localStorage.getItem('valuationData');
    if (!dataString) return null;
    
    const data = JSON.parse(dataString);
    
    // Ensure the data has the expected structure
    if (!data.vin) {
      console.warn('Retrieved validation data is missing VIN');
    }
    
    return data as VehicleData;
  } catch (error) {
    console.error('Failed to retrieve validation data:', error);
    return null;
  }
}

/**
 * Clear validation data from localStorage
 */
export function clearValidationData() {
  localStorage.removeItem('valuationData');
  localStorage.removeItem('tempVIN');
  localStorage.removeItem('tempMileage');
  localStorage.removeItem('tempGearbox');
  localStorage.removeItem('valuationTimestamp');
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
    
    // If successful, store the data in localStorage using our standardized format
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
