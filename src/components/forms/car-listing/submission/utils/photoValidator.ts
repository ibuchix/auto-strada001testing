
/**
 * Photo Validation Utilities
 * Created: 2025-05-31
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Validates that all required photos have been uploaded
 * @returns An array of missing photo field names (empty if all required photos are present)
 */
export function validateRequiredPhotos(formData: CarListingFormData): string[] {
  // Required photo fields (these should match the fields in the form)
  const requiredPhotoFields = [
    'frontView',
    'rearView', 
    'driverSide',
    'passengerSide',
    'dashboard',
    'interiorFront',
    'interiorRear',
    'odometer'
  ];
  
  // Check for explicit photoValidationPassed flag
  if (formData.photoValidationPassed) {
    return []; // If validation was explicitly marked as passed, return no errors
  }
  
  const missingFields: string[] = [];
  
  // Check each required field
  for (const field of requiredPhotoFields) {
    // Check in requiredPhotos object first (preferred storage)
    const photoUrl = formData.requiredPhotos?.[field] || formData[field as keyof CarListingFormData];
    
    if (!photoUrl) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}

/**
 * Checks if all required photos are present
 */
export function areAllRequiredPhotosPresent(formData: CarListingFormData): boolean {
  return validateRequiredPhotos(formData).length === 0;
}
