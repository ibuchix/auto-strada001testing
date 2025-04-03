
/**
 * Form validation utilities
 * - Enhanced to support severity levels and multi-section steps
 * - Added support for non-critical warnings vs. blocking errors
 * - 2025-04-03: Updated to match the consolidated 3-step form structure
 * - 2025-04-04: Fixed export of EnhancedValidationResult type
 */
import { CarListingFormData } from "@/types/forms";

// Define validation severity levels
export enum ValidationSeverity {
  CRITICAL = 'critical', // Prevents form progression
  WARNING = 'warning',   // Allows form progression with confirmation
  INFO = 'info'          // Just informational, doesn't affect progression
}

// Define the shape of a validation error
export interface ValidationError {
  field: string;
  message: string;
  severity: ValidationSeverity;
  recoverable: boolean;
}

// Enhanced validation result with severity
export interface EnhancedValidationResult {
  field: string;
  message: string;
  severity: ValidationSeverity;
  recoverable: boolean;
}

/**
 * Primary validation function with severity classification
 */
export const validateFormDataWithSeverity = (
  formData: CarListingFormData,
  section: string
): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Validate based on section ID
  switch (section) {
    case 'vehicle-details':
      if (!formData.make?.trim()) {
        errors.push({
          field: 'make',
          message: 'Vehicle make is required',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (!formData.model?.trim()) {
        errors.push({
          field: 'model',
          message: 'Vehicle model is required',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (!formData.year || formData.year < 1886 || formData.year > new Date().getFullYear() + 1) {
        errors.push({
          field: 'year',
          message: 'Please enter a valid year',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (!formData.mileage && formData.mileage !== 0) {
        errors.push({
          field: 'mileage',
          message: 'Mileage is required',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (!formData.vin?.trim() || formData.vin.length !== 17) {
        errors.push({
          field: 'vin',
          message: 'Please enter a valid 17-character VIN',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      break;
      
    case 'photos':
      if (!Array.isArray(formData.uploadedPhotos) || formData.uploadedPhotos.length < 3) {
        errors.push({
          field: 'uploadedPhotos',
          message: 'Please upload at least 3 photos',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      break;
      
    case 'rims':
      if (formData.isRegisteredInPoland && !formData.rimPhotosComplete) {
        errors.push({
          field: 'rimPhotos',
          message: 'Rim photos are required for vehicles registered in Poland',
          severity: ValidationSeverity.WARNING,
          recoverable: true
        });
      }
      break;
      
    case 'vehicle-status':
      if (formData.isDamaged === undefined) {
        errors.push({
          field: 'isDamaged',
          message: 'Please indicate if the vehicle has any damage',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (formData.isDamaged && !formData.damageDescription?.trim()) {
        errors.push({
          field: 'damageDescription',
          message: 'Please describe the damage to your vehicle',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      break;
      
    case 'features':
      const hasAnyFeature = formData.features && Object.values(formData.features).some(Boolean);
      if (!hasAnyFeature) {
        errors.push({
          field: 'features',
          message: 'Please select at least one vehicle feature',
          severity: ValidationSeverity.WARNING,
          recoverable: true
        });
      }
      break;
      
    case 'service-history':
      if (!formData.serviceHistoryType) {
        errors.push({
          field: 'serviceHistoryType',
          message: 'Please select a service history type',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      break;
      
    case 'personal-details':
      if (!formData.name?.trim()) {
        errors.push({
          field: 'name',
          message: 'Name is required',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (!formData.address?.trim()) {
        errors.push({
          field: 'address',
          message: 'Address is required',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      
      if (!formData.mobileNumber?.trim()) {
        errors.push({
          field: 'mobileNumber',
          message: 'Mobile number is required',
          severity: ValidationSeverity.CRITICAL,
          recoverable: false
        });
      }
      break;
      
    case 'finance-details':
      if (formData.hasOutstandingFinance) {
        if (!formData.financeAmount) {
          errors.push({
            field: 'financeAmount',
            message: 'Finance amount is required',
            severity: ValidationSeverity.CRITICAL,
            recoverable: false
          });
        }
        
        if (!formData.financeProvider) {
          errors.push({
            field: 'financeProvider',
            message: 'Finance provider is required',
            severity: ValidationSeverity.CRITICAL,
            recoverable: false
          });
        }
      }
      break;
      
    case 'seller-notes':
      if (!formData.sellerNotes?.trim()) {
        errors.push({
          field: 'sellerNotes',
          message: 'Please provide some notes about your vehicle',
          severity: ValidationSeverity.WARNING,
          recoverable: true
        });
      }
      break;
  }

  return errors;
};

// Helper function to check if there are critical errors
export const hasCriticalErrors = (errors: ValidationError[]): boolean => {
  return errors.some(error => 
    error.severity === ValidationSeverity.CRITICAL && !error.recoverable
  );
};

// Helper function to get only warnings (non-critical errors)
export const getWarnings = (errors: ValidationError[]): ValidationError[] => {
  return errors.filter(error => 
    error.severity === ValidationSeverity.WARNING || 
    (error.severity === ValidationSeverity.CRITICAL && error.recoverable)
  );
};

// Export a function to validate the entire form data
export const validateFormData = (data: CarListingFormData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Basic required field validation
  if (!data.make?.trim()) {
    errors.push({
      field: 'make',
      message: 'Vehicle make is required',
      severity: ValidationSeverity.CRITICAL,
      recoverable: false
    });
  }
  
  if (!data.model?.trim()) {
    errors.push({
      field: 'model',
      message: 'Vehicle model is required',
      severity: ValidationSeverity.CRITICAL,
      recoverable: false
    });
  }
  
  if (!data.year || data.year < 1886) {
    errors.push({
      field: 'year',
      message: 'Please enter a valid year',
      severity: ValidationSeverity.CRITICAL,
      recoverable: false
    });
  }
  
  if (!data.mileage && data.mileage !== 0) {
    errors.push({
      field: 'mileage',
      message: 'Mileage is required',
      severity: ValidationSeverity.CRITICAL,
      recoverable: false
    });
  }
  
  if (!data.vin?.trim()) {
    errors.push({
      field: 'vin',
      message: 'VIN is required',
      severity: ValidationSeverity.CRITICAL,
      recoverable: false
    });
  }
  
  return errors;
};
