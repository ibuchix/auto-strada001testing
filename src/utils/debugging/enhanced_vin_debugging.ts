
/**
 * Enhanced VIN debugging utilities
 * Created: 2025-05-11 - Extracted from useValuationRequest.ts
 */

/**
 * Validates the VIN format
 * @param vin Vehicle identification number to validate
 * @returns Whether the VIN appears valid
 */
export const isValidVIN = (vin: string): boolean => {
  // VIN must be 17 characters and contain only alphanumeric characters
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
};

/**
 * Normalizes a VIN by removing spaces and converting to uppercase
 * @param vin Vehicle identification number to normalize
 * @returns Normalized VIN
 */
export const normalizeVIN = (vin: string): string => {
  return vin.replace(/\s/g, '').toUpperCase();
};

/**
 * Validates valuation parameters
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param gearbox Transmission type
 * @returns Validation result with cleaned parameters if valid
 */
export function validateValuationParams(
  vin: string,
  mileage: number,
  gearbox: string = 'manual'
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
    return { valid: false, error: 'VIN is required' };
  }
  
  const normalizedVIN = normalizeVIN(vin);
  
  if (!isValidVIN(normalizedVIN)) {
    return { valid: false, error: 'Invalid VIN format. Must be 17 alphanumeric characters' };
  }
  
  // Check mileage
  if (isNaN(mileage) || mileage < 0) {
    return { valid: false, error: 'Mileage must be a positive number' };
  }
  
  // Check gearbox
  const normalizedGearbox = gearbox.toLowerCase();
  
  if (!['manual', 'automatic'].includes(normalizedGearbox)) {
    return { valid: false, error: 'Gearbox must be either "manual" or "automatic"' };
  }
  
  // Return cleaned parameters
  return {
    valid: true,
    cleanedParams: {
      vin: normalizedVIN,
      mileage: Math.round(mileage), // Ensure mileage is an integer
      gearbox: normalizedGearbox
    }
  };
}

/**
 * Get an error message for VIN validation issues
 * @param vin Vehicle identification number
 * @returns Error message if invalid, or null if valid
 */
export function getVINErrorMessage(vin: string): string | null {
  if (!vin) {
    return 'VIN is required';
  }
  
  const normalizedVIN = normalizeVIN(vin);
  
  if (normalizedVIN.length !== 17) {
    return `VIN must be exactly 17 characters (currently ${normalizedVIN.length})`;
  }
  
  if (!isValidVIN(normalizedVIN)) {
    return 'Invalid VIN format. VIN should contain only alphanumeric characters (except I, O, and Q)';
  }
  
  return null;
}
