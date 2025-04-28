
/**
 * VIN validation service
 * Updated: 2025-04-28 - Added proper URL encoding for VIN parameters
 */

import { supabase } from "@/integrations/supabase/client";

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  transmission?: string;
  mileage?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  error?: string;
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
    const encodedVin = encodeURIComponent(cleanVin);
    
    const { data, error } = await supabase.functions.invoke('get-vehicle-valuation', {
      body: { 
        vin: encodedVin,
        mileage: mileage,
        gearbox: gearbox
      }
    });

    if (error) {
      console.error('VIN validation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate VIN'
      };
    }

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Unexpected error during VIN validation:', error);
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
