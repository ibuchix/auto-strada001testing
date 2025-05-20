
/**
 * Photo Field Processor Utility
 * Created: 2025-05-19
 * Updated: 2025-05-20 - Added more robust consolidation and validation logic
 * 
 * Transforms individual photo fields into the required_photos JSONB structure 
 * expected by the database schema.
 */

import { CarListingFormData } from "@/types/forms";

// Known photo field names in the form that should be consolidated
const PHOTO_FIELD_KEYS = [
  'dashboard',
  'exterior_front',
  'exterior_rear',
  'exterior_side',
  'interior_front',
  'interior_rear',
  'odometer',
  'trunk',
  'engine',
  'damage_front',
  'damage_rear',
  'damage_side',
  'wheel',
  'roof'
];

// Define which photo fields are mandatory
const REQUIRED_PHOTO_FIELDS = [
  'dashboard',
  'exterior_front',
  'exterior_rear',
  'exterior_side',
  'interior_front',
  'odometer'
];

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
  
  // Start by checking if there's already a required_photos object
  if (formData.required_photos) {
    // Copy existing required_photos
    Object.assign(requiredPhotos, formData.required_photos);
  }
  
  // Then add or update with any individual fields
  PHOTO_FIELD_KEYS.forEach(key => {
    // Only process if the field exists in the form data
    if (key in formData) {
      const value = formData[key];
      
      // Only add non-empty values to the photos object
      if (value && typeof value === 'string') {
        requiredPhotos[key] = value;
      }
      
      // Remove the individual field from the updated form data
      delete updatedFormData[key];
    }
  });
  
  // Add the consolidated required_photos field to the updated form data
  updatedFormData.required_photos = requiredPhotos;
  
  // Log the consolidation results for debugging
  console.log("Photo field consolidation:", {
    originalKeys: Object.keys(formData).filter(k => PHOTO_FIELD_KEYS.includes(k)),
    consolidatedKeys: Object.keys(requiredPhotos),
    requiredFields: REQUIRED_PHOTO_FIELDS,
    hasAllRequired: REQUIRED_PHOTO_FIELDS.every(field => !!requiredPhotos[field])
  });
  
  return { 
    updatedFormData, 
    requiredPhotos 
  };
};

/**
 * Validates that all required photo fields are present
 * @returns Empty array if valid, otherwise array of missing field names
 */
export const validateRequiredPhotos = (formData: CarListingFormData): string[] => {
  // Check if form data already has consolidated required_photos
  if (formData.required_photos) {
    const missingFields = REQUIRED_PHOTO_FIELDS.filter(
      field => !formData.required_photos[field]
    );
    return missingFields;
  }
  
  // Otherwise check individual fields
  const missingFields = REQUIRED_PHOTO_FIELDS.filter(
    field => !formData[field]
  );
  
  return missingFields;
};
