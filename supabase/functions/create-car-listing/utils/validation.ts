
/**
 * Validation utilities for create-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

/**
 * Validates listing request data
 * @param data Request data to validate
 * @returns Validation result with success flag and optional error message
 */
export function validateListingRequest(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: 'Missing request data' };
  }
  
  const { valuationData, userId, vin, mileage, transmission } = data;
  
  if (!valuationData) {
    return { valid: false, error: 'Missing valuationData' };
  }
  
  if (!userId) {
    return { valid: false, error: 'Missing userId' };
  }
  
  if (!vin || typeof vin !== 'string' || vin.length !== 17) {
    return { valid: false, error: 'Invalid VIN. Must be 17 characters.' };
  }
  
  if (mileage === undefined || mileage === null || isNaN(Number(mileage))) {
    return { valid: false, error: 'Invalid mileage. Must be a number.' };
  }
  
  if (!transmission || (transmission !== 'manual' && transmission !== 'automatic')) {
    return { valid: false, error: 'Invalid transmission. Must be either "manual" or "automatic".' };
  }
  
  return { valid: true };
}

/**
 * Validates a VIN (Vehicle Identification Number)
 * @param vin The VIN to validate
 * @returns True if valid, false otherwise
 */
export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}
