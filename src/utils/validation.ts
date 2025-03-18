
/**
 * Changes made:
 * - 2024-08-20: Enhanced validation utilities with standardized error formatting
 * - 2024-10-30: Added formatCurrency function for consistent currency display
 */

import { md5 } from "js-md5";

export const calculateChecksum = (apiId: string, apiSecret: string, vin: string): string => {
  return md5(apiId + apiSecret + vin);
};

export const isValidVin = (vin: string): boolean => {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
};

export const isValidMileage = (mileage: string): boolean => {
  const mileageNum = Number(mileage);
  return (
    !isNaN(mileageNum) &&
    mileageNum > 0 &&
    mileageNum < 1000000 &&
    Number.isInteger(mileageNum) &&
    /^\d+$/.test(mileage)
  );
};

/**
 * Format a currency value consistently throughout the application
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Parse Supabase error into a user-friendly message
 */
export const parseSupabaseError = (error: any): string => {
  // Handle specific Supabase error codes
  if (error?.code === '23505') {
    return 'This item already exists. Please try with different information.';
  }
  
  if (error?.code === '23503') {
    return 'This operation references data that doesn\'t exist.';
  }
  
  if (error?.code === '42501') {
    return 'You don\'t have permission to perform this action.';
  }
  
  // Handle authentication errors
  if (error?.message?.includes('not authenticated')) {
    return 'You need to be signed in to perform this action.';
  }
  
  // Handle rate limiting
  if (error?.message?.includes('rate limit') || error?.message?.includes('too many requests')) {
    return 'Too many requests. Please try again in a moment.';
  }
  
  // Handle timeout errors
  if (error?.message?.includes('timeout') || error?.message?.includes('timed out')) {
    return 'The request took too long to complete. Please try again.';
  }
  
  // Return the error message or a generic one if no message exists
  return error?.message || error?.error_description || 'An unexpected error occurred. Please try again.';
};

/**
 * Validates an object against a schema of validation functions
 * @param data Object to validate
 * @param schema Validation schema with field names and validation functions
 * @returns Array of validation errors (empty if valid)
 */
export interface ValidationResult {
  field: string;
  message: string;
}

export interface ValidationSchema {
  [key: string]: {
    validate: (value: any) => boolean;
    message: string;
  };
}

export const validateWithSchema = (
  data: Record<string, any>,
  schema: ValidationSchema
): ValidationResult[] => {
  const errors: ValidationResult[] = [];
  
  Object.entries(schema).forEach(([field, { validate, message }]) => {
    // Skip validation if the field doesn't exist in the data
    if (!(field in data)) return;
    
    // Validate the field
    if (!validate(data[field])) {
      errors.push({ field, message });
    }
  });
  
  return errors;
};
