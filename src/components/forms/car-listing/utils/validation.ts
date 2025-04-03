
/**
 * Changes made:
 * - 2024-08-20: Enhanced form validation with standardized approach
 * - 2024-08-22: Added ValidationError type export to fix type errors in RequirementsDisplay.tsx
 * - 2025-06-02: Removed validation for non-existent has_documentation field
 * - 2025-08-28: Implemented enhanced validation with detailed field validation
 * - 2025-12-05: Integrated with new error factory for consistent error handling
 * - 2025-12-07: Added validation severity levels and improved error reporting
 */

import { CarListingFormData } from "@/types/forms";
import { ValidationResult } from "@/utils/validation";
import { validateVIN } from "@/validation/carListing";
import { createFieldError, createFormError } from "@/errors/factory";
import { ValidationErrorCode } from "@/errors/types";

// Export the ValidationError type to be used by RequirementsDisplay
export type ValidationError = ValidationResult;

// Validation severity levels
export enum ValidationSeverity {
  CRITICAL = 'critical',   // Blocks form submission
  WARNING = 'warning',     // Shows warning but allows submission
  INFO = 'info'            // Informational only
}

// Enhanced validation result with severity
export interface EnhancedValidationResult extends ValidationResult {
  severity: ValidationSeverity;
  recoverable: boolean;
}

// Validation utility to check if a string field is empty
const isEmptyField = (value: string | undefined): boolean => {
  return !value || value.trim() === '';
};

// Original validation function for backward compatibility
export const validateFormData = (data: Partial<CarListingFormData>): ValidationResult[] => {
  const errors: ValidationResult[] = [];

  // Basic vehicle information
  if (isEmptyField(data.make)) {
    errors.push({ field: 'make', message: 'Make is required' });
  }
  if (isEmptyField(data.model)) {
    errors.push({ field: 'model', message: 'Model is required' });
  }
  if (!data.vin || !validateVIN(data.vin)) {
    errors.push({ field: 'vin', message: 'Invalid VIN' });
  }

  // Personal Details
  if (isEmptyField(data.name)) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (isEmptyField(data.address)) {
    errors.push({ field: 'address', message: 'Address is required' });
  }
  if (isEmptyField(data.mobileNumber)) {
    errors.push({ field: 'mobileNumber', message: 'Mobile number is required' });
  } else if (!/^\+?[0-9\s\-()]{8,}$/.test(data.mobileNumber!)) {
    errors.push({ field: 'mobileNumber', message: 'Please enter a valid mobile number' });
  }

  // Vehicle Status
  if (data.isDamaged && (!data.damageReports || data.damageReports.length === 0)) {
    errors.push({ field: 'damageReports', message: 'Please document any damage' });
  }

  // Service History
  if (!data.serviceHistoryType) {
    errors.push({ field: 'serviceHistoryType', message: 'Service history type is required' });
  }

  // Additional Info
  if (!data.seatMaterial) {
    errors.push({ field: 'seatMaterial', message: 'Seat material is required' });
  }
  if (!data.numberOfKeys) {
    errors.push({ field: 'numberOfKeys', message: 'Number of keys is required' });
  } else if (!/^[1-9]\d*$/.test(data.numberOfKeys)) {
    errors.push({ field: 'numberOfKeys', message: 'Number of keys must be a positive integer' });
  }

  // Photos
  if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
    errors.push({ field: 'uploadedPhotos', message: 'At least one photo is required' });
  }

  // Rim Photos
  if (!data.rimPhotosComplete) {
    errors.push({ field: 'rimPhotos', message: 'All rim photos are required' });
  }

  return errors;
};

// Enhanced validation that includes severity levels to allow progression with warnings
export const validateFormDataWithSeverity = (data: Partial<CarListingFormData>, formSection?: string): EnhancedValidationResult[] => {
  const errors: EnhancedValidationResult[] = [];
  const currentSection = formSection || 'all';
  
  console.log(`Running validation for section: ${currentSection}`);
  
  // Define validation rules with severity
  const validationRules = [
    // Basic vehicle information - CRITICAL
    {
      section: 'vehicle-details',
      validate: () => {
        if (isEmptyField(data.make)) {
          errors.push({ 
            field: 'make', 
            message: 'Make is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        if (isEmptyField(data.model)) {
          errors.push({ 
            field: 'model', 
            message: 'Model is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        if (!data.vin) {
          errors.push({ 
            field: 'vin', 
            message: 'VIN is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        } else if (!validateVIN(data.vin)) {
          errors.push({ 
            field: 'vin', 
            message: 'Invalid VIN format', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        if (!data.year) {
          errors.push({ 
            field: 'year', 
            message: 'Year is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        if (!data.mileage) {
          errors.push({ 
            field: 'mileage', 
            message: 'Mileage is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
      }
    },
    
    // Vehicle Status - Some CRITICAL, some WARNING
    {
      section: 'vehicle-status',
      validate: () => {
        if (data.isDamaged === undefined) {
          errors.push({ 
            field: 'isDamaged', 
            message: 'Please specify if vehicle has damage', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        
        if (data.isRegisteredInPoland === undefined) {
          errors.push({ 
            field: 'isRegisteredInPoland', 
            message: 'Registration information required', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
        
        if (data.isDamaged && (!data.damageReports || data.damageReports.length === 0)) {
          errors.push({ 
            field: 'damageReports', 
            message: 'Please document any damage', 
            severity: ValidationSeverity.WARNING, // Allow to continue even with warning
            recoverable: true 
          });
        }
      }
    },
    
    // Personal Details - All CRITICAL
    {
      section: 'personal-details',
      validate: () => {
        if (isEmptyField(data.name)) {
          errors.push({ 
            field: 'name', 
            message: 'Name is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        
        if (isEmptyField(data.address)) {
          errors.push({ 
            field: 'address', 
            message: 'Address is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        }
        
        if (isEmptyField(data.mobileNumber)) {
          errors.push({ 
            field: 'mobileNumber', 
            message: 'Mobile number is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        } else if (!/^\+?[0-9\s\-()]{8,}$/.test(data.mobileNumber!)) {
          errors.push({ 
            field: 'mobileNumber', 
            message: 'Please enter a valid mobile number', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
      }
    },
    
    // Features - All WARNING
    {
      section: 'features',
      validate: () => {
        if (!data.features || Object.values(data.features || {}).every(v => v === false)) {
          errors.push({ 
            field: 'features', 
            message: 'Please select at least one feature', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
      }
    },
    
    // Service History - Some CRITICAL, some WARNING
    {
      section: 'service-history',
      validate: () => {
        if (!data.serviceHistoryType) {
          errors.push({ 
            field: 'serviceHistoryType', 
            message: 'Service history type is required', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
      }
    },
    
    // Additional Info - WARNING
    {
      section: 'additional-info',
      validate: () => {
        if (!data.seatMaterial) {
          errors.push({ 
            field: 'seatMaterial', 
            message: 'Seat material is required', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
        
        if (!data.numberOfKeys) {
          errors.push({ 
            field: 'numberOfKeys', 
            message: 'Number of keys is required', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        } else if (!/^[1-9]\d*$/.test(data.numberOfKeys)) {
          errors.push({ 
            field: 'numberOfKeys', 
            message: 'Number of keys must be a positive integer', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
      }
    },
    
    // Photos - CRITICAL
    {
      section: 'photos',
      validate: () => {
        if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
          errors.push({ 
            field: 'uploadedPhotos', 
            message: 'At least one photo is required', 
            severity: ValidationSeverity.CRITICAL,
            recoverable: false 
          });
        } else if (data.uploadedPhotos.length < 3) {
          errors.push({ 
            field: 'uploadedPhotos', 
            message: 'We recommend at least 3 photos', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
      }
    },
    
    // Rim Photos - WARNING if registered in Poland
    {
      section: 'rims',
      validate: () => {
        if (data.isRegisteredInPoland && !data.rimPhotosComplete) {
          errors.push({ 
            field: 'rimPhotos', 
            message: 'All rim photos are required for vehicles registered in Poland', 
            severity: data.isRegisteredInPoland ? ValidationSeverity.CRITICAL : ValidationSeverity.WARNING,
            recoverable: !data.isRegisteredInPoland 
          });
        }
      }
    },
    
    // Seller Notes - All WARNING
    {
      section: 'notes',
      validate: () => {
        if (isEmptyField(data.sellerNotes)) {
          errors.push({ 
            field: 'sellerNotes', 
            message: 'Seller notes recommended for better offers', 
            severity: ValidationSeverity.WARNING,
            recoverable: true 
          });
        }
      }
    }
  ];
  
  // Run all validations or just those for the current section
  if (currentSection === 'all') {
    validationRules.forEach(rule => rule.validate());
  } else {
    validationRules
      .filter(rule => rule.section === currentSection)
      .forEach(rule => rule.validate());
  }
  
  // Log validation results
  console.log(`Validation for ${currentSection} completed:`, {
    totalErrors: errors.length,
    criticalErrors: errors.filter(e => e.severity === ValidationSeverity.CRITICAL).length,
    warningErrors: errors.filter(e => e.severity === ValidationSeverity.WARNING).length,
    recoverable: errors.every(e => e.recoverable)
  });
  
  return errors;
};

// Enhanced validation that returns proper error objects instead of simple messages
export const validateFormDataWithErrors = (data: Partial<CarListingFormData>) => {
  try {
    // Run validation with severity and section context
    const validationResults = validateFormDataWithSeverity(data);
    
    // Check for critical errors only
    const criticalErrors = validationResults.filter(e => 
      e.severity === ValidationSeverity.CRITICAL && !e.recoverable
    );
    
    if (criticalErrors.length > 0) {
      // Create a proper field error for the first critical error
      const firstError = criticalErrors[0];
      throw createFieldError(firstError.field, firstError.message, {
        code: ValidationErrorCode.REQUIRED_FIELD
      });
    }
    
    // Check overall form completeness but only count critical errors
    if (criticalErrors.length > 0) {
      throw createFormError('Form validation failed', {
        code: ValidationErrorCode.INCOMPLETE_FORM,
        description: `${criticalErrors.length} field(s) require attention`
      });
    }
    
    return true;
  } catch (error) {
    console.error("Validation error:", error);
    throw error;
  }
};

export const getFormProgress = (data: Partial<CarListingFormData>): number => {
  const totalSteps = 8; // Total number of major sections
  let completedSteps = 0;

  // Personal Details
  if (data.name && data.address && data.mobileNumber) {
    completedSteps++;
  }

  // Vehicle Status
  if (!data.isDamaged || (data.isDamaged && data.damageReports?.length)) {
    completedSteps++;
  }

  // Features
  if (Object.values(data.features || {}).some(Boolean)) {
    completedSteps++;
  }

  // Service History
  if (data.serviceHistoryType) {
    completedSteps++;
  }

  // Additional Info
  if (data.seatMaterial && data.numberOfKeys) {
    completedSteps++;
  }

  // Photos
  if (data.uploadedPhotos?.length) {
    completedSteps++;
  }

  // Rim Photos
  if (data.rimPhotosComplete) {
    completedSteps++;
  }

  // Seller Notes
  if (data.sellerNotes) {
    completedSteps++;
  }

  return Math.round((completedSteps / totalSteps) * 100);
};
