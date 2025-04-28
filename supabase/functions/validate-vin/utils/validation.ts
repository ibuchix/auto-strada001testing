
/**
 * Validation utilities for VIN validation
 * Updated: 2025-04-28 - Improved VIN validation to be more flexible
 */

export const isValidVin = (vin: string): boolean => {
  // First, basic null/undefined check
  if (vin === null || vin === undefined) {
    return false;
  }
  
  // Convert to string if it's not already
  const vinString = String(vin);
  
  // Clean the VIN string
  const cleanVin = vinString.trim().toUpperCase().replace(/[^A-Z0-9]/gi, '');
  
  // Empty check
  if (cleanVin.length === 0) {
    return false;
  }
  
  // More permissive VIN validation - any alphanumeric string of appropriate length
  return cleanVin.length >= 5 && cleanVin.length <= 17;
};

export const isValidMileage = (mileage: number): boolean => {
  return Number.isInteger(mileage) && mileage >= 0 && mileage < 1000000;
};

