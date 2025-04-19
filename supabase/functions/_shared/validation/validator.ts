
/**
 * Validation utilities
 * Created: 2025-04-19
 */

import { ValidationResult, ValuationData, ValidationOptions } from './types';

/**
 * Validate VIN format
 * @param vin Vehicle Identification Number
 * @returns Whether the VIN is valid
 */
export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') return false;
  return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin);
}

/**
 * Validate mileage
 * @param mileage Vehicle mileage
 * @returns Whether the mileage is valid
 */
export function isValidMileage(mileage: number): boolean {
  return Number.isInteger(mileage) && mileage >= 0 && mileage < 1000000;
}

/**
 * Validate transmission type
 * @param transmission Transmission type
 * @returns Whether the transmission type is valid
 */
export function isValidTransmission(transmission: any): boolean {
  if (!transmission) return true; // Optional field
  return ['manual', 'automatic'].includes(String(transmission).toLowerCase());
}

/**
 * Validate year
 * @param year Vehicle year
 * @returns Whether the year is valid
 */
export function isValidYear(year: number): boolean {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= 1900 && year <= currentYear + 1;
}

/**
 * Validate ValuationData object
 * @param data ValuationData to validate
 * @param options Validation options
 * @returns Validation result
 */
export function validateValuationData(
  data: Partial<ValuationData>,
  options: ValidationOptions = { requireAllFields: true }
): ValidationResult {
  const errors: string[] = [];
  
  // Required fields
  if (!data.vin || !isValidVin(data.vin)) {
    errors.push('Invalid VIN format');
  }
  
  if (data.mileage === undefined || !isValidMileage(data.mileage)) {
    errors.push('Invalid mileage');
  }
  
  // Optional fields or fields that might not be required depending on options
  if (options.requireAllFields) {
    if (!data.make || data.make.length < 2) {
      errors.push('Invalid make');
    }
    
    if (!data.model || data.model.length < 1) {
      errors.push('Invalid model');
    }
    
    if (data.year === undefined || !isValidYear(data.year)) {
      errors.push('Invalid year');
    }
    
    if (data.valuation === undefined || isNaN(data.valuation) || data.valuation < 0) {
      errors.push('Invalid valuation amount');
    }
  } else {
    // Only validate if present
    if (data.year !== undefined && !isValidYear(data.year)) {
      errors.push('Invalid year');
    }
    
    if (data.valuation !== undefined && (isNaN(data.valuation) || data.valuation < 0)) {
      errors.push('Invalid valuation amount');
    }
  }
  
  // Always validate transmission if present
  if (data.transmission !== undefined && !isValidTransmission(data.transmission)) {
    errors.push('Invalid transmission type');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate Polish license plate
 * @param plate License plate number
 * @returns Whether the license plate is valid
 */
export function isValidLicensePlate(plate: string): boolean {
  if (!plate || typeof plate !== 'string') return false;
  // Standard Polish format: 2-3 letters followed by 4-5 digits/letters
  return /^[A-Z]{2,3}[A-Z0-9]{4,5}$/.test(plate.toUpperCase().replace(/\s/g, ''));
}

/**
 * Validate user ID format (UUID)
 * @param userId User ID
 * @returns Whether the user ID is valid
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || typeof userId !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
}
