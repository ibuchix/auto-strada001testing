
/**
 * Shared validation utilities
 * Updated: 2025-04-28 - Improved VIN validation to be more flexible
 */

/**
 * Validate VIN format with flexible approach
 * @param vin Vehicle Identification Number
 * @returns Boolean indicating valid VIN
 */
export function isValidVin(vin: string): boolean {
  // Handle null/undefined/empty
  if (!vin) return false;
  
  // Clean and normalize the VIN
  const cleanVin = String(vin).trim().toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/gi, '');
  
  // Accept any alphanumeric string between 5-17 characters
  return cleanVin.length >= 5 && cleanVin.length <= 17;
}

/**
 * Validate mileage
 * @param mileage Vehicle mileage
 * @returns Boolean indicating valid mileage
 */
export function isValidMileage(mileage: number): boolean {
  return Number.isInteger(mileage) 
    && mileage >= 0 
    && mileage < 1000000;
}

/**
 * Validate transmission type
 * @param transmission Transmission type
 * @returns Boolean indicating valid transmission
 */
export function isValidTransmission(transmission: any): boolean {
  if (!transmission) return true; // Optional field
  const validTypes = ['manual', 'automatic'];
  return validTypes.includes(String(transmission).toLowerCase());
}
