/**
 * Photo Field Processor Utility
 * Created: 2025-05-19
 * Updated: 2025-05-20 - Added more robust consolidation and validation logic
 * Updated: 2025-05-20 - Integrated with standardized photo field mapping
 * 
 * Transforms individual photo fields into the required_photos JSONB structure 
 * expected by the database schema.
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
  
  // Start by checking if there's already a required_photos object
  if (formData.required_photos) {
    // Copy existing required_photos
    Object.assign(requiredPhotos, formData.required_photos);
  }
  
  // Then add or update with any individual fields
  // Process all known photo field keys, using standardized names
  Object.keys(formData).forEach(key => {
    // Only process if the key is a known photo field or matches PHOTO_FIELD_MAP
    const standardKey = standardizePhotoCategory(key);
    if (PHOTO_FIELD_MAP[key] || Object.values(PHOTO_FIELD_MAP).includes(key)) {
      const value = formData[key];
      
      // Only add non-empty values to the photos object
      if (value && typeof value === 'string') {
        requiredPhotos[standardKey] = value;
      }
      
      // Remove the individual field from the updated form data
      delete updatedFormData[key];
    }
  });
  
  // Add the consolidated required_photos field to the updated form data
  updatedFormData.required_photos = requiredPhotos;
  
  // Log the consolidation results for debugging
  console.log("Photo field consolidation:", {
    originalKeys: Object.keys(formData).filter(k => Object.keys(PHOTO_FIELD_MAP).includes(k) || Object.values(PHOTO_FIELD_MAP).includes(k)),
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
