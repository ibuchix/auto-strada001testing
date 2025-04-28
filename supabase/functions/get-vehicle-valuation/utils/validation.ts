
/**
 * Validation utilities for get-vehicle-valuation
 * Created: 2025-04-19 - Extracted from inline implementation
 * Updated: 2025-04-28 - Fixed VIN validation to handle more manufacturer formats
 * Updated: 2025-04-28 - Further improved VIN validation to be more permissive
 */

export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  
  // Very permissive VIN validation - most VINs are 17 characters, but some 
  // older or international models might have different formats
  // Just ensure it's alphanumeric and a reasonable length
  return vin.length >= 10 && vin.length <= 17 && /^[A-Za-z0-9]+$/i.test(vin);
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
  
  // Additional request validation logging for debugging
  console.log({
    timestamp: new Date().toISOString(),
    operation: 'validating_request',
    level: 'info',
    hasVin: !!data.vin,
    vinLength: data.vin ? data.vin.length : 0,
    vinValue: data.vin,
    hasMileage: data.mileage !== undefined,
    mileageValue: data.mileage
  });
  
  if (!isValidVin(data.vin)) {
    return { valid: false, error: 'Invalid VIN format. Must be between 10-17 alphanumeric characters.' };
  }
  
  if (!isValidMileage(data.mileage)) {
    return { valid: false, error: 'Invalid mileage. Must be a number between 0 and 1,000,000.' };
  }
  
  return { valid: true };
}
