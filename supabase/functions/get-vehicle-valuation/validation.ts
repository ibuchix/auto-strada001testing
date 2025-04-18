
/**
 * Validation utilities for vehicle valuation
 */

export const isValidVin = (vin: string): boolean => {
  if (!vin || typeof vin !== 'string') return false;
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
};

export const isValidMileage = (mileage: any): boolean => {
  if (mileage === undefined || mileage === null) return false;
  const mileageNumber = Number(mileage);
  return !isNaN(mileageNumber) && mileageNumber >= 0 && mileageNumber <= 1000000;
};
