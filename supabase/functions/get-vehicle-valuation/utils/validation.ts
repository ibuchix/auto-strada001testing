
/**
 * Validation utilities for get-vehicle-valuation
 * Created: 2025-04-19 - Extracted from inline implementation
 */

export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

export function isValidMileage(mileage: any): boolean {
  if (mileage === undefined || mileage === null) return false;
  const mileageNumber = Number(mileage);
  return !isNaN(mileageNumber) && mileageNumber >= 0 && mileageNumber <= 1000000;
}

export function isValidTransmission(transmission: string): boolean {
  if (!transmission || typeof transmission !== 'string') return false;
  return ['manual', 'automatic', 'semi-automatic', 'cvt'].includes(transmission.toLowerCase());
}

export function validateRequest(data: any): { valid: boolean; error?: string } {
  if (!data) {
    return { valid: false, error: 'Request body is required' };
  }
  
  if (!isValidVin(data.vin)) {
    return { valid: false, error: 'Invalid VIN format. Must be 17 alphanumeric characters.' };
  }
  
  if (!isValidMileage(data.mileage)) {
    return { valid: false, error: 'Invalid mileage. Must be a number between 0 and 1,000,000.' };
  }
  
  return { valid: true };
}
