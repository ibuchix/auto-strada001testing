
/**
 * Validation utilities for car listings
 * - 2025-04-03: Fixed ValidationSeverity export as type instead of enum
 */

import { CarListingFormData } from "@/types/forms";

// Define validation error types with severity
export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  recoverable: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Enhanced validation result with warning support
export interface EnhancedValidationResult {
  valid: boolean;
  canProceed: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates the form data
 * @param data Form data to validate
 * @returns Array of validation error messages
 */
export function validateFormData(data: CarListingFormData): string[] {
  const errors: string[] = [];
  
  // Basic required field validation
  if (!data.make) errors.push("Make is required");
  if (!data.model) errors.push("Model is required");
  if (!data.year) errors.push("Year is required");
  if (!data.mileage && data.mileage !== 0) errors.push("Mileage is required");
  
  // VIN validation
  if (data.vin && !isValidVIN(data.vin)) {
    errors.push("Invalid VIN format");
  }
  
  // Mileage must be non-negative
  if (data.mileage !== undefined && data.mileage < 0) {
    errors.push("Mileage cannot be negative");
  }
  
  return errors;
}

/**
 * Enhanced form validation with severity levels and proceed capability
 * @param data Form data to validate
 * @returns Enhanced validation result with errors and warnings
 */
export function validateFormDataEnhanced(data: CarListingFormData): EnhancedValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Required fields (errors)
  if (!data.make) {
    errors.push({
      field: 'make',
      message: 'Make is required',
      severity: 'error',
      recoverable: false
    });
  }
  
  if (!data.model) {
    errors.push({
      field: 'model',
      message: 'Model is required',
      severity: 'error',
      recoverable: false
    });
  }
  
  if (!data.year) {
    errors.push({
      field: 'year',
      message: 'Year is required',
      severity: 'error',
      recoverable: false
    });
  }
  
  if (!data.mileage && data.mileage !== 0) {
    errors.push({
      field: 'mileage',
      message: 'Mileage is required',
      severity: 'error',
      recoverable: false
    });
  }
  
  // VIN validation (error if provided but invalid)
  if (data.vin && !isValidVIN(data.vin)) {
    errors.push({
      field: 'vin',
      message: 'Invalid VIN format',
      severity: 'error',
      recoverable: true
    });
  }
  
  // VIN missing (warning)
  if (!data.vin) {
    warnings.push({
      field: 'vin',
      message: 'VIN is recommended for better accuracy',
      severity: 'warning',
      recoverable: true
    });
  }
  
  // Mileage very high (warning)
  if (data.mileage && data.mileage > 300000) {
    warnings.push({
      field: 'mileage',
      message: 'Mileage is unusually high, please verify',
      severity: 'warning',
      recoverable: true
    });
  }
  
  return {
    valid: errors.length === 0,
    canProceed: errors.filter(e => !e.recoverable).length === 0,
    errors,
    warnings
  };
}

/**
 * Validates a VIN string
 * @param vin VIN to validate
 * @returns True if valid
 */
function isValidVIN(vin: string): boolean {
  // Basic VIN validation - 17 characters, alphanumeric except I,O,Q
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(vin);
}

/**
 * Gets field-specific validation rules
 * @param fieldName Field name
 * @returns Validation rules object
 */
export function getFieldValidation(fieldName: string) {
  const validationRules: Record<string, any> = {
    make: { required: "Make is required" },
    model: { required: "Model is required" },
    year: { 
      required: "Year is required",
      min: { value: 1970, message: "Year must be 1970 or later" },
      max: { value: new Date().getFullYear() + 1, message: "Year cannot be in the future" }
    },
    mileage: {
      required: "Mileage is required",
      min: { value: 0, message: "Mileage cannot be negative" }
    },
    vin: {
      pattern: { 
        value: /^[A-HJ-NPR-Z0-9]{17}$/i, 
        message: "VIN must be 17 characters and contain only valid alphanumeric characters" 
      }
    }
  };
  
  return validationRules[fieldName] || {};
}
