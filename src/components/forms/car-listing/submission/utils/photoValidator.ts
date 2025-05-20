
/**
 * Photo Validation Utilities
 * Created: 2025-05-31
 * Updated: 2025-06-24 - Fixed validation to handle both camelCase and snake_case field names
 * Updated: 2025-06-24 - Integrated with standardizePhotoCategory from photoMapping.ts
 */

import { CarListingFormData } from "@/types/forms";
import { REQUIRED_PHOTO_FIELDS, standardizePhotoCategory } from "@/utils/photoMapping";

/**
 * Validates that all required photos have been uploaded
 * @returns An array of missing photo field names (empty if all required photos are present)
 */
export function validateRequiredPhotos(formData: CarListingFormData): string[] {
  // Check for explicit photoValidationPassed flag
  if (formData.photoValidationPassed) {
    return []; // If validation was explicitly marked as passed, return no errors
  }
  
  const missingFields: string[] = [];
  
  // Check for required photos using standardized field names
  for (const requiredField of REQUIRED_PHOTO_FIELDS) {
    let fieldFound = false;
    
    // Check in requiredPhotos object (preferred storage)
    if (formData.requiredPhotos && formData.requiredPhotos[requiredField]) {
      fieldFound = true;
      continue;
    }
    
    // Check in vehiclePhotos object using standardized names
    if (formData.vehiclePhotos) {
      // Check each field in vehiclePhotos
      for (const [key, value] of Object.entries(formData.vehiclePhotos)) {
        if (standardizePhotoCategory(key) === requiredField && value) {
          fieldFound = true;
          break;
        }
      }
      if (fieldFound) continue;
    }
    
    // Check each field in formData directly (legacy support)
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && standardizePhotoCategory(key) === requiredField && value) {
        fieldFound = true;
        break;
      }
    }
    
    if (!fieldFound) {
      missingFields.push(requiredField);
    }
  }
  
  console.log("Photo validation results:", {
    missingFields,
    requiredFields: REQUIRED_PHOTO_FIELDS,
    formDataKeys: Object.keys(formData),
    hasRequiredPhotos: !!formData.requiredPhotos,
    hasVehiclePhotos: !!formData.vehiclePhotos
  });
  
  return missingFields;
}

/**
 * Checks if all required photos are present
 */
export function areAllRequiredPhotosPresent(formData: CarListingFormData): boolean {
  return validateRequiredPhotos(formData).length === 0;
}
