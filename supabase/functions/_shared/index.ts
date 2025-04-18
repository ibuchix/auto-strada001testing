
// Consolidated exports for shared utilities

export * from './cors.ts';
export * from './logging.ts';
export * from './checksum.ts';
export * from './response-formatter.ts';
export * from './request-validator.ts';
export * from './client.ts';
export * from './types.ts';

// Add common validation utilities
export const isValidVin = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin);
};

export const isValidMileage = (mileage: number): boolean => {
  return Number.isInteger(mileage) && mileage >= 0 && mileage < 1000000;
};

// Error class for validation errors
export class ValidationError extends Error {
  code: string;
  
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
  }
}
