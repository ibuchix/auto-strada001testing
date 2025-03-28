/**
 * Changes made:
 * - 2024-08-20: Enhanced form validation with standardized approach
 * - 2024-08-22: Added ValidationError type export to fix type errors in RequirementsDisplay.tsx
 * - 2025-06-02: Removed validation for non-existent has_documentation field
 * - 2025-08-28: Implemented enhanced validation with detailed field validation
 * - 2025-12-05: Integrated with new error factory for consistent error handling
 */

import { CarListingFormData } from "@/types/forms";
import { ValidationResult } from "@/utils/validation";
import { validateVIN } from "@/validation/carListing";
import { createFieldError, createFormError } from "@/errors/factory";
import { ValidationErrorCode } from "@/errors/types";

// Export the ValidationError type to be used by RequirementsDisplay
export type ValidationError = ValidationResult;

// Validation utility to check if a string field is empty
const isEmptyField = (value: string | undefined): boolean => {
  return !value || value.trim() === '';
};

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

// Enhanced validation that returns proper error objects instead of simple messages
export const validateFormDataWithErrors = (data: Partial<CarListingFormData>) => {
  // Basic vehicle information
  if (isEmptyField(data.make)) {
    throw createFieldError('make', 'Make is required', {
      code: ValidationErrorCode.REQUIRED_FIELD
    });
  }
  
  if (isEmptyField(data.model)) {
    throw createFieldError('model', 'Model is required', {
      code: ValidationErrorCode.REQUIRED_FIELD
    });
  }
  
  if (!data.vin) {
    throw createFieldError('vin', 'VIN is required', {
      code: ValidationErrorCode.REQUIRED_FIELD
    });
  } else if (!validateVIN(data.vin)) {
    throw createFieldError('vin', 'Invalid VIN format', {
      code: ValidationErrorCode.INVALID_VIN,
      description: 'VIN must be 17 characters and contain only valid characters'
    });
  }
  
  // All remaining validation...
  // Note: We keep the traditional validation for backward compatibility
  
  // Check overall form completeness
  const errors = validateFormData(data);
  if (errors.length > 0) {
    throw createFormError('Form validation failed', {
      code: ValidationErrorCode.INCOMPLETE_FORM,
      description: `${errors.length} field(s) require attention`
    });
  }
  
  return true;
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
