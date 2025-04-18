
/**
 * Validation utilities for vehicle valuation
 * Created: 2025-04-18
 */

export const isValidVin = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin);
};

export const isValidMileage = (mileage: number): boolean => {
  return Number.isInteger(mileage) && mileage >= 0 && mileage < 1000000;
};

export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}
