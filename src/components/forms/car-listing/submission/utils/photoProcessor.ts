
/**
 * Photo Field Processor Utility
 * Created: 2025-05-19
 * Updated: 2025-05-20 - Added more robust consolidation and validation logic
 * Updated: 2025-05-20 - Integrated with standardized photo field mapping
 * Updated: 2025-05-23 - Enhanced validation with detailed debugging and error messages
 * Updated: 2025-05-20 - Updated to ensure odometer is properly validated as a required field
 * Updated: 2025-05-27 - Updated to handle camelCase to snake_case conversion consistently
 * Updated: 2025-06-24 - Fixed consolidation logic to properly handle both naming conventions
 * Updated: 2025-06-25 - Enhanced photo field processing with better debugging and checks
 * Updated: 2025-05-24 - Fixed import of PHOTO_FIELD_MAP from photoMapping.ts
 */

import { CarListingFormData } from "@/types/forms";
import { PHOTO_FIELD_MAP, REQUIRED_PHOTO_FIELDS, standardizePhotoCategory } from "@/utils/photoMapping";

/**
 * Consolidates individual photo fields into a required_photos object
 * to match the database schema expectation
 */
export const consolidatePhotoFields = (formData: CarListingFormData): { 
  updatedFormData: CarListingFormData,
  requiredPhotos: Record<string, string>
} => {
  // Create a copy of the form data to avoid mutating the original
  const updatedFormData = { ...formData };
  
  // Extract photo fields from formData into a new object
  const requiredPhotos: Record<string, string> = {};
  
  // Log the starting state for debugging
  console.log("Starting photo consolidation with:", {
    hasRequiredPhotos: !!formData.requiredPhotos,
    hasVehiclePhotos: !!formData.vehiclePhotos,
    expectedFields: REQUIRED_PHOTO_FIELDS
  });
  
  // Start by checking if there's already a requiredPhotos object
  if (formData.requiredPhotos) {
    // Copy existing requiredPhotos
    Object.assign(requiredPhotos, formData.requiredPhotos);
    console.log("Found existing requiredPhotos:", Object.keys(requiredPhotos));
  }
  
  // Then add or update with any individual fields
  // Process all known photo field keys, using standardized names
  Object.keys(formData).forEach(key => {
    // Only process if the key is a known photo field or matches PHOTO_FIELD_MAP
    const standardKey = standardizePhotoCategory(key);
    if (PHOTO_FIELD_MAP[key] || Object.values(PHOTO_FIELD_MAP).includes(key)) {
      const value = formData[key as keyof typeof formData];
      
      // Only add non-empty values to the photos object
      if (value && typeof value === 'string') {
        requiredPhotos[standardKey] = value;
        console.log(`Adding field ${key} as ${standardKey}`);
      }
      
      // Remove individual field only if it's not a core property we need
      if (!['requiredPhotos', 'photoValidationPassed', 'requiredPhotosComplete'].includes(key)) {
        delete (updatedFormData as any)[key];
      }
    }
  });
  
  // Add any fields from vehiclePhotos object if it exists
  if (formData.vehiclePhotos && typeof formData.vehiclePhotos === 'object') {
    console.log("Processing vehiclePhotos:", Object.keys(formData.vehiclePhotos));
    Object.entries(formData.vehiclePhotos).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        const standardKey = standardizePhotoCategory(key);
        requiredPhotos[standardKey] = value;
        console.log(`Adding from vehiclePhotos: ${key} as ${standardKey}`);
      }
    });
  }
  
  // Add the consolidated requiredPhotos field to the updated form data
  updatedFormData.requiredPhotos = requiredPhotos;
  
  // Auto-set photoValidationPassed if all required photos are present
  const hasAllRequiredPhotos = REQUIRED_PHOTO_FIELDS.every(field => !!requiredPhotos[field]);
  if (hasAllRequiredPhotos) {
    updatedFormData.photoValidationPassed = true;
    console.log("All required photos are present, marking validation as passed");
  }
  
  // Log the consolidation results with detailed information for debugging
  console.log("Photo field consolidation:", {
    originalKeys: Object.keys(formData).filter(k => 
      Object.keys(PHOTO_FIELD_MAP).includes(k) || 
      Object.values(PHOTO_FIELD_MAP).includes(k)
    ),
    consolidatedKeys: Object.keys(requiredPhotos),
    requiredFields: REQUIRED_PHOTO_FIELDS,
    hasAllRequired: hasAllRequiredPhotos,
    detailedMapping: REQUIRED_PHOTO_FIELDS.map(field => ({
      field,
      present: !!requiredPhotos[field],
      source: Object.entries(PHOTO_FIELD_MAP)
        .filter(([_, value]) => value === field)
        .map(([key]) => key),
      value: requiredPhotos[field] ? 
        (requiredPhotos[field].length > 20 ? 
          requiredPhotos[field].substring(0, 20) + '...' : 
          requiredPhotos[field]) : 
        'missing'
    }))
  });
  
  return { 
    updatedFormData, 
    requiredPhotos 
  };
};

/**
 * Processes photo fields in the formData to prepare for submission
 * Extracts and organizes photos according to their type
 */
export const processPhotosForSubmission = (formData: CarListingFormData): { 
  requiredPhotos: Record<string, string>;
  additionalPhotos: string[];
} => {
  const { requiredPhotos } = consolidatePhotoFields(formData);
  const additionalPhotos = formData.uploadedPhotos || [];
  
  return {
    requiredPhotos,
    additionalPhotos
  };
};
