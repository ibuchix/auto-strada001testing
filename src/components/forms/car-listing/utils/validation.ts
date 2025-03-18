
/**
 * Changes made:
 * - 2024-08-20: Enhanced form validation with standardized approach
 * - 2024-08-22: Added ValidationError type export to fix type errors in RequirementsDisplay.tsx
 */

import { CarListingFormData } from "@/types/forms";
import { ValidationResult } from "@/utils/validation";

// Export the ValidationError type to be used by RequirementsDisplay
export type ValidationError = ValidationResult;

export const validateFormData = (data: Partial<CarListingFormData>): ValidationResult[] => {
  const errors: ValidationResult[] = [];

  // Personal Details
  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' });
  }
  if (!data.mobileNumber?.trim()) {
    errors.push({ field: 'mobileNumber', message: 'Mobile number is required' });
  } else if (!/^\+?[0-9\s\-()]{8,}$/.test(data.mobileNumber)) {
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
