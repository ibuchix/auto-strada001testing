
/**
 * VIN validation service
 * Updated: 2025-04-28 - Added proper URL encoding for VIN parameters
 * Updated: 2025-04-28 - Fixed type inconsistencies and added storage function
 * Updated: 2025-04-29 - Fixed request format to match edge function expectations
 * Updated: 2025-04-30 - Enhanced error handling and logging
 */

import { supabase } from "@/integrations/supabase/client";

export interface VehicleData {
  make: string;
  model: string;
  year?: number;
  transmission?: string;
  mileage?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  error?: string;
  vin?: string;
}

export const validateVin = async ({ 
  vin, 
  mileage, 
  gearbox = 'manual' 
}: { 
  vin: string; 
  mileage: number; 
  gearbox?: string; 
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // Clean and encode the VIN
    const cleanVin = vin.trim().replace(/\s+/g, '');
    
    console.log(`[VIN-Validation] Calling VIN validation for: ${cleanVin}, mileage: ${mileage}, gearbox: ${gearbox}`);
    
    // IMPORTANT: Use body parameter for POST request instead of URL params
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { 
        vin: cleanVin,
        mileage: mileage,
        gearbox: gearbox
      }
    });

    if (error) {
      console.error('[VIN-Validation] Supabase function error:', error);
      
      // Add more detailed error logging
      if (error.message) {
        console.error('[VIN-Validation] Error message:', error.message);
      }
      
      if (error.context) {
        console.error('[VIN-Validation] Error context:', error.context);
      }
      
      return {
        success: false,
        error: error.message || 'Failed to validate VIN'
      };
    }

    // Log successful response data for debugging
    console.log('[VIN-Validation] Response received:', {
      dataReceived: !!data,
      hasSuccess: data?.success !== undefined,
      hasError: data?.error !== undefined,
      hasVehicleData: !!(data?.make && data?.model)
    });

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('[VIN-Validation] Unexpected error:', error);
    
    // Enhanced error logging
    if (error.message) {
      console.error('[VIN-Validation] Error message:', error.message);
    }
    
    if (error.stack) {
      console.error('[VIN-Validation] Stack trace:', error.stack);
    }
    
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};

export const isValidVinFormat = (vin: string): boolean => {
  if (!vin) return false;
  const cleanVin = vin.trim().replace(/[^A-Z0-9]/gi, '');
  return cleanVin.length >= 5 && cleanVin.length <= 17;
};

export const getVINErrorMessage = (vin: string): string | null => {
  if (!vin) return "VIN is required";
  const cleanVin = vin.trim().replace(/[^A-Z0-9]/gi, '');
  if (cleanVin.length < 5) return "VIN must be at least 5 characters long";
  if (cleanVin.length > 17) return "VIN cannot be longer than 17 characters";
  return null;
};

// Add the function for retrieving stored validation data
export const getStoredValidationData = (): VehicleData | null => {
  try {
    const storedData = localStorage.getItem('valuationData');
    if (!storedData) return null;
    
    return JSON.parse(storedData) as VehicleData;
  } catch (error) {
    console.error('[VIN-Validation] Error retrieving stored validation data:', error);
    return null;
  }
};
