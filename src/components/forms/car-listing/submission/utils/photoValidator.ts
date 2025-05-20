
/**
 * Photo Validation Utilities
 * Created: 2025-05-31
 * Updated: 2025-06-24 - Fixed validation to handle both camelCase and snake_case field names
 * Updated: 2025-06-24 - Integrated with standardizePhotoCategory from photoMapping.ts
 * Updated: 2025-06-25 - Enhanced validation with more detailed debugging and improved field checking
 */

import { CarListingFormData } from "@/types/forms";
import { REQUIRED_PHOTO_FIELDS, standardizePhotoCategory, PHOTO_FIELD_MAP } from "@/utils/photoMapping";

/**
 * Validates that all required photos have been uploaded
 * @returns An array of missing photo field names (empty if all required photos are present)
 */
export function validateRequiredPhotos(formData: CarListingFormData): string[] {
  // Check for explicit photoValidationPassed flag
  if (formData.photoValidationPassed === true) {
    console.log("Photo validation explicitly marked as passed");
    return []; // If validation was explicitly marked as passed, return no errors
  }
  
  const missingFields: string[] = [];
  const foundFields: Record<string, string> = {};
  
  // Check for required photos using standardized field names
  for (const requiredField of REQUIRED_PHOTO_FIELDS) {
    let fieldFound = false;
    let foundValue: string | undefined;
    
    // First check in requiredPhotos object (preferred storage)
    if (formData.requiredPhotos && formData.requiredPhotos[requiredField]) {
      fieldFound = true;
      foundValue = formData.requiredPhotos[requiredField];
      foundFields[requiredField] = `requiredPhotos.${requiredField}`;
      continue;
    }
    
    // Then check in vehiclePhotos object using standardized names
    if (formData.vehiclePhotos) {
      // Check each field in vehiclePhotos
      for (const [key, value] of Object.entries(formData.vehiclePhotos)) {
        if (standardizePhotoCategory(key) === requiredField && value) {
          fieldFound = true;
          foundValue = value;
          foundFields[requiredField] = `vehiclePhotos.${key}`;
          break;
        }
      }
      if (fieldFound) continue;
    }
    
    // Check each field in formData directly (legacy support)
    for (const [key, value] of Object.entries(formData)) {
      // Skip objects and non-string values
      if (typeof value !== 'string' || !value) continue;
      
      // Check if this field maps to our required field
      if (standardizePhotoCategory(key) === requiredField) {
        fieldFound = true;
        foundValue = value;
        foundFields[requiredField] = key;
        break;
      }
    }
    
    // Also check for camelCase equivalents explicitly
    // Find the camelCase key that maps to this snake_case field
    const camelCaseKey = Object.entries(PHOTO_FIELD_MAP)
      .find(([_, val]) => val === requiredField)?.[0];
    
    if (camelCaseKey && formData[camelCaseKey as keyof typeof formData]) {
      fieldFound = true;
      foundValue = formData[camelCaseKey as keyof typeof formData] as string;
      foundFields[requiredField] = camelCaseKey;
    }
    
    if (!fieldFound) {
      missingFields.push(requiredField);
    }
  }
  
  console.log("Photo validation results:", {
    missingFields,
    foundFields,
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
