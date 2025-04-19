
/**
 * Validation utilities for VIN validation
 * Updated: 2025-04-19
 */
export const isValidVin = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin);
};

export const isValidMileage = (mileage: number): boolean => {
  return Number.isInteger(mileage) && mileage >= 0 && mileage < 1000000;
};
