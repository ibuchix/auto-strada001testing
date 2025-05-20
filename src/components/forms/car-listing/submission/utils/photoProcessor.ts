
/**
 * Photo Field Processor Utility
 * Created: 2025-05-19
 * Updated: 2025-05-20 - Added more robust consolidation and validation logic
 * Updated: 2025-05-20 - Integrated with standardized photo field mapping
 * Updated: 2025-05-23 - Enhanced validation with detailed debugging and error messages
 * Updated: 2025-05-20 - Updated to ensure odometer is properly validated as a required field
 * Updated: 2025-05-27 - Updated to handle camelCase to snake_case conversion consistently
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
  
  // Start by checking if there's already a requiredPhotos object
  if (formData.requiredPhotos) {
    // Copy existing requiredPhotos
    Object.assign(requiredPhotos, formData.requiredPhotos);
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
  
  // Add any fields from vehiclePhotos object if it exists
  if (formData.vehiclePhotos && typeof formData.vehiclePhotos === 'object') {
    Object.entries(formData.vehiclePhotos).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        const standardKey = standardizePhotoCategory(key);
        requiredPhotos[standardKey] = value;
      }
    });
  }
  
  // Add the consolidated requiredPhotos field to the updated form data
  updatedFormData.requiredPhotos = requiredPhotos;
  
  // Log the consolidation results with detailed information for debugging
  console.log("Photo field consolidation:", {
    originalKeys: Object.keys(formData).filter(k => 
      Object.keys(PHOTO_FIELD_MAP).includes(k) || 
      Object.values(PHOTO_FIELD_MAP).includes(k)
    ),
    consolidatedKeys: Object.keys(requiredPhotos),
    requiredFields: REQUIRED_PHOTO_FIELDS,
    hasAllRequired: REQUIRED_PHOTO_FIELDS.every(field => !!requiredPhotos[field]),
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
 * Validates that all required photo fields are present
 * @returns Empty array if valid, otherwise array of missing field names
 */
export const validateRequiredPhotos = (formData: CarListingFormData): string[] => {
  // First consolidate the photo fields to ensure we're working with standardized data
  const { requiredPhotos } = consolidatePhotoFields(formData);
  
  // Check which required fields are missing
  const missingFields = REQUIRED_PHOTO_FIELDS.filter(
    field => !requiredPhotos[field]
  );
  
  // Log detailed validation results
  console.log("Photo validation results:", {
    requiredFields: REQUIRED_PHOTO_FIELDS,
    presentFields: Object.keys(requiredPhotos),
    missingFields,
    formDataFields: Object.keys(formData).filter(k => 
      k.includes('photo') || 
      k.includes('interior') || 
      k.includes('exterior') || 
      k === 'dashboard' || 
      k === 'odometer'
    ),
    hasRequiredPhotosObject: !!formData.requiredPhotos,
    vehiclePhotosPresent: !!formData.vehiclePhotos,
    odometerPresent: !!requiredPhotos['odometer'] || 
      !!(formData.vehiclePhotos && formData.vehiclePhotos.odometer)
  });
  
  return missingFields;
};
