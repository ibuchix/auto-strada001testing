
/**
 * Photo Helper Utilities
 * Created: 2025-06-24
 * Updated: 2025-06-25 - Added setPhotoField and setRimPhotoField functions
 * Updated: 2025-06-26 - Fixed TypeScript type errors with dynamic field names
 * Updated: 2025-05-24 - Fixed import error - using standardizePhotoCategory instead of sanitizePhotoCategory
 * 
 * Contains helper functions for handling photo uploads and field naming
 * to ensure consistent handling between camelCase and snake_case fields.
 */

import { standardizePhotoCategory } from "@/utils/photoMapping";
import { CarListingFormData } from "@/types/forms";
import { UseFormReturn, Path } from "react-hook-form";
import { setFieldValue } from "@/utils/formHelpers";

/**
 * Adapts the temporary file uploader to the format expected by photo uploader components
 */
export const adaptTemporaryFileUploader = (uploader: any) => {
  return {
    files: uploader.files || [],
    isUploading: uploader.isUploading || false,
    progress: uploader.progress || 0,
    uploadFiles: uploader.uploadFiles || (() => Promise.resolve()),
    removeFile: uploader.removeFile || (() => {}),
  };
};

/**
 * Sets a photo field in the form data with proper validation
 */
export const setPhotoField = (
  fieldName: string,
  value: string,
  form: UseFormReturn<CarListingFormData>
) => {
  console.log(`[PhotoHelpers] Setting photo field:`, { 
    fieldName, 
    value, 
    fieldNameType: typeof fieldName 
  });
  
  // Validate and sanitize the field name using standardizePhotoCategory
  const sanitizedFieldName = standardizePhotoCategory(fieldName);
  
  try {
    // Set the direct field using type assertion for dynamic field name
    form.setValue(sanitizedFieldName as Path<CarListingFormData>, value, { shouldDirty: true });
    
    // Also update the vehiclePhotos object
    const vehiclePhotos = form.getValues('vehiclePhotos') || {};
    form.setValue('vehiclePhotos', {
      ...vehiclePhotos,
      [sanitizedFieldName]: value
    }, { shouldDirty: true });
    
    // And update the standardized field in requiredPhotos
    const requiredPhotos = form.getValues('requiredPhotos') || {};
    const standardizedName = standardizePhotoCategory(sanitizedFieldName);
    form.setValue('requiredPhotos', {
      ...requiredPhotos,
      [standardizedName]: value
    }, { shouldDirty: true });
    
    console.log(`[PhotoHelpers] Successfully set photo field:`, { 
      original: fieldName, 
      sanitized: sanitizedFieldName, 
      standardized: standardizedName 
    });
  } catch (error) {
    console.error(`[PhotoHelpers] Error setting photo field:`, { 
      fieldName, 
      sanitizedFieldName, 
      error 
    });
  }
};

/**
 * Sets a rim photo field in the form data with proper validation
 */
export const setRimPhotoField = (
  position: string,
  value: string,
  form: UseFormReturn<CarListingFormData>
) => {
  console.log(`[PhotoHelpers] Setting rim photo field:`, { 
    position, 
    value, 
    positionType: typeof position 
  });
  
  // Validate and sanitize the position using standardizePhotoCategory
  const sanitizedPosition = standardizePhotoCategory(position);
  
  try {
    // Get existing rim photos or initialize an empty object
    const rimPhotos = form.getValues('rimPhotos') || {};
    
    // Update the specified position
    form.setValue('rimPhotos', {
      ...rimPhotos,
      [sanitizedPosition]: value
    }, { shouldDirty: true });
    
    console.log(`[PhotoHelpers] Successfully set rim photo field:`, { 
      original: position, 
      sanitized: sanitizedPosition 
    });
  } catch (error) {
    console.error(`[PhotoHelpers] Error setting rim photo field:`, { 
      position, 
      sanitizedPosition, 
      error 
    });
  }
};

/**
 * Updates vehicle photos in the form, ensuring both camelCase and 
 * snake_case variants are set for compatibility
 */
export const updateVehiclePhotos = (
  form: UseFormReturn<CarListingFormData>, 
  photoUpdates: Record<string, string | null | undefined> = {}
) => {
  console.log(`[PhotoHelpers] Updating vehicle photos:`, { 
    updateCount: Object.keys(photoUpdates).length, 
    updates: photoUpdates 
  });
  
  try {
    // First, get existing vehicle photos
    const vehiclePhotos = form.getValues('vehiclePhotos') || {};
    const requiredPhotos = form.getValues('requiredPhotos') || {};
    
    const updatedVehiclePhotos = { ...vehiclePhotos };
    const updatedRequiredPhotos = { ...requiredPhotos };
    
    // Update each photo field
    Object.entries(photoUpdates).forEach(([fieldName, value]) => {
      if (value) {
        // Sanitize the field name using standardizePhotoCategory
        const sanitizedFieldName = standardizePhotoCategory(fieldName);
        
        // Update camelCase fields in vehiclePhotos
        updatedVehiclePhotos[sanitizedFieldName] = value;
        
        // Also update snake_case version in requiredPhotos
        const standardizedName = standardizePhotoCategory(sanitizedFieldName);
        updatedRequiredPhotos[standardizedName] = value;
        
        console.log(`[PhotoHelpers] Processed photo update:`, { 
          original: fieldName, 
          sanitized: sanitizedFieldName, 
          standardized: standardizedName, 
          value 
        });
      }
    });
    
    // Update both fields in the form
    form.setValue('vehiclePhotos', updatedVehiclePhotos, { shouldDirty: true });
    form.setValue('requiredPhotos', updatedRequiredPhotos, { shouldDirty: true });
    
    // Check if all required photos are present
    const allRequiredPhotos = import('@/utils/photoMapping').then(module => {
      const allRequiredUploaded = module.REQUIRED_PHOTO_FIELDS.every(field => 
        updatedRequiredPhotos[field]
      );
      
      if (allRequiredUploaded) {
        // Set the validation passed flag
        form.setValue('photoValidationPassed', true, { shouldDirty: true });
      }
      
      return allRequiredUploaded;
    });
    
    console.log(`[PhotoHelpers] Vehicle photos update complete`);
    return allRequiredPhotos;
  } catch (error) {
    console.error(`[PhotoHelpers] Error updating vehicle photos:`, { 
      error, 
      photoUpdates 
    });
    return Promise.resolve(false);
  }
};
