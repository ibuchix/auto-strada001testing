
/**
 * Enhanced VIN Debugging Utilities
 * Created: 2025-05-02 - Provides detailed debugging tools for VIN validation
 * Updated: 2025-05-10 - Fixed debugVinApiResponse function signature
 */

import { normalizeVIN } from "../vinValidation";

/**
 * Validates and cleans valuation parameters
 */
export function validateValuationParams(
  vin: string | undefined,
  mileage: number | undefined,
  gearbox: string | undefined
): { 
  valid: boolean; 
  error?: string; 
  cleanedParams?: { 
    vin: string; 
    mileage: number; 
    gearbox: string;
  } 
} {
  // Check VIN
  if (!vin) {
    return {
      valid: false,
      error: "VIN is required"
    };
  }

  const cleanVin = normalizeVIN(vin);
  
  if (cleanVin.length < 5) {
    return {
      valid: false,
      error: "VIN must be at least 5 characters"
    };
  }

  // Check mileage
  const numericMileage = typeof mileage === 'number' ? mileage : 
    typeof mileage === 'string' ? parseInt(mileage, 10) : NaN;
  
  if (isNaN(numericMileage)) {
    return {
      valid: false,
      error: "Mileage must be a number"
    };
  }

  // Normalize gearbox
  const normalizedGearbox = gearbox?.toLowerCase() || 'manual';
  
  // Return cleaned parameters
  return {
    valid: true,
    cleanedParams: {
      vin: cleanVin,
      mileage: Math.max(0, numericMileage), // Ensure non-negative
      gearbox: normalizedGearbox === 'automatic' ? 'automatic' : 'manual'
    }
  };
}

/**
 * Deep debug of API response to locate pricing data
 */
export function debugVinApiResponse(data: any): { 
  foundPriceData: boolean;
  paths: string[];
  values: Record<string, any>;
} {
  const paths: string[] = [];
  const values: Record<string, any> = {};
  
  // Search for price-related fields in the object
  function searchForPrices(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        searchForPrices(item, `${path}[${index}]`);
      });
      return;
    }
    
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      // Look for price-related fields
      if (/price|valuation|cost|value/i.test(key) && typeof value !== 'object') {
        paths.push(newPath);
        values[newPath] = value;
      }
      
      // Recursively search nested objects
      if (value && typeof value === 'object') {
        searchForPrices(value, newPath);
      }
    }
  }
  
  searchForPrices(data);
  
  return {
    foundPriceData: paths.length > 0,
    paths,
    values
  };
}
