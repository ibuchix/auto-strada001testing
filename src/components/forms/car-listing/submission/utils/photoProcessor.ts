
/**
 * Photo Field Processor Utility
 * Created: 2025-05-19
 * Updated: 2025-05-24 - SIMPLIFIED - Direct photo storage without temp uploads
 * Updated: 2025-05-24 - Fixed photo field mapping to use corrected standardizePhotoCategory
 */

import { CarListingFormData } from "@/types/forms";
import { PHOTO_FIELD_MAP, REQUIRED_PHOTO_FIELDS, standardizePhotoCategory } from "@/utils/photoMapping";

/**
 * Consolidates individual photo fields into a required_photos object
 * SIMPLIFIED - Direct storage without temp upload complexity
 */
export const consolidatePhotoFields = (formData: CarListingFormData): { 
  updatedFormData: CarListingFormData,
  requiredPhotos: Record<string, string>
} => {
  const updatedFormData = { ...formData };
  const requiredPhotos: Record<string, string> = {};
  
  console.log("Starting simplified photo consolidation with:", {
    hasRequiredPhotos: !!formData.requiredPhotos,
    hasVehiclePhotos: !!formData.vehiclePhotos,
    expectedFields: REQUIRED_PHOTO_FIELDS
  });
  
  // Start by checking if there's already a requiredPhotos object
  if (formData.requiredPhotos) {
    Object.assign(requiredPhotos, formData.requiredPhotos);
    console.log("Found existing requiredPhotos:", Object.keys(requiredPhotos));
  }
  
  // Process all known photo field keys using the corrected mapping
  Object.keys(formData).forEach(key => {
    const value = formData[key as keyof typeof formData];
    
    // Check if this key maps to a photo field
    if (PHOTO_FIELD_MAP[key] && value && typeof value === 'string') {
      const standardKey = PHOTO_FIELD_MAP[key]; // Use direct mapping first
      requiredPhotos[standardKey] = value;
      console.log(`Direct mapping: ${key} -> ${standardKey}`);
      
      // Remove individual field if it's not a core property
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
        console.log(`From vehiclePhotos: ${key} -> ${standardKey}`);
      }
    });
  }
  
  // Set the consolidated requiredPhotos field
  updatedFormData.requiredPhotos = requiredPhotos;
  
  // Auto-set photoValidationPassed if all required photos are present
  const hasAllRequiredPhotos = REQUIRED_PHOTO_FIELDS.every(field => !!requiredPhotos[field]);
  if (hasAllRequiredPhotos) {
    updatedFormData.photoValidationPassed = true;
    console.log("All required photos are present, marking validation as passed");
  }
  
  console.log("Simplified photo consolidation complete:", {
    consolidatedKeys: Object.keys(requiredPhotos),
    requiredFields: REQUIRED_PHOTO_FIELDS,
    hasAllRequired: hasAllRequiredPhotos,
    mapping: REQUIRED_PHOTO_FIELDS.map(field => ({
      field,
      present: !!requiredPhotos[field],
      value: requiredPhotos[field] ? 'present' : 'missing'
    }))
  });
  
  return { 
    updatedFormData, 
    requiredPhotos 
  };
};

/**
 * SIMPLIFIED photo processing for submission
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
