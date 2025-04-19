
/**
 * Validation utilities for handle-car-listing
 * Created: 2025-04-19 - Extracted from inline validation logic
 */

/**
 * Validates a Vehicle Identification Number (VIN)
 * @param vin VIN to validate
 * @returns True if valid, false otherwise
 */
export function validateVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

/**
 * Validates mileage value
 * @param mileage Mileage to validate
 * @returns True if valid, false otherwise
 */
export function validateMileage(mileage: any): boolean {
  if (mileage === undefined || mileage === null) return false;
  const mileageNumber = Number(mileage);
  return !isNaN(mileageNumber) && mileageNumber >= 0 && mileageNumber <= 1000000;
}

/**
 * Validates transmission/gearbox value
 * @param gearbox Gearbox/transmission to validate
 * @returns True if valid, false otherwise
 */
export function validateGearbox(gearbox: string): boolean {
  if (!gearbox || typeof gearbox !== 'string') return false;
  return ['manual', 'automatic', 'semi-automatic', 'cvt'].includes(gearbox.toLowerCase());
}

/**
 * Validates the complete request object
 * @param requestData Request data to validate
 * @returns Validation result with success flag and optional error message
 */
export function validateRequest(requestData: any): { valid: boolean; error?: string } {
  if (!requestData) {
    return { valid: false, error: 'Missing request data' };
  }
  
  const { vin, mileage, gearbox } = requestData;
  
  if (!validateVin(vin)) {
    return { valid: false, error: 'Invalid VIN format. Must be 17 alphanumeric characters (excluding I, O, Q).' };
  }
  
  if (!validateMileage(mileage)) {
    return { valid: false, error: 'Invalid mileage. Must be a number between 0 and 1,000,000.' };
  }
  
  if (!validateGearbox(gearbox)) {
    return { valid: false, error: 'Invalid gearbox type. Must be one of: manual, automatic, semi-automatic, cvt.' };
  }
  
  return { valid: true };
}
