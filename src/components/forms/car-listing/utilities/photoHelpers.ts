
/**
 * Photo Helper Utilities
 * Created: 2025-07-10
 * Updated: 2025-08-18 - Added rim photo helpers
 * Updated: 2025-05-20 - Improved type safety and rim photo handling
 * Updated: 2025-05-21 - Fixed adapter function compatibility, added setPhotoField and updateVehiclePhotos
 */

import { UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { CarListingFormData } from '@/types/forms';
import { TemporaryFile } from '@/hooks/useTemporaryFileUpload';

/**
 * Sets a field in the form for rim photos
 */
export const setRimPhotoField = (
  position: string, 
  value: string,
  setValue: UseFormSetValue<CarListingFormData>
): void => {
  try {
    // Get existing rim photos or initialize empty object
    const currentRimPhotos = getValue(setValue, 'rimPhotos') || {};
    
    // Update the specific position
    const updatedRimPhotos = {
      ...currentRimPhotos,
      [position]: value
    };
    
    // Set the updated object back to the form
    setValue('rimPhotos', updatedRimPhotos, { shouldDirty: true });
    
    console.log(`Updated rim photo for position: ${position}`);
  } catch (error) {
    console.error('Error setting rim photo field:', error);
    throw error;
  }
};

/**
 * Sets a regular photo field in the form
 */
export const setPhotoField = (
  fieldName: string,
  value: string,
  setValue: UseFormSetValue<CarListingFormData>
): void => {
  try {
    // Set the value for the specific field
    setValue(fieldName as any, value, { shouldDirty: true });
    console.log(`Updated photo field: ${fieldName}`);
  } catch (error) {
    console.error(`Error setting photo field ${fieldName}:`, error);
    throw error;
  }
};

/**
 * Updates the vehiclePhotos object in the form
 */
export const updateVehiclePhotos = (
  setValue: UseFormSetValue<CarListingFormData>,
  getValues: UseFormGetValues<CarListingFormData>
): void => {
  try {
    // Create a consolidated object with all photo URLs
    const vehiclePhotos = {
      frontView: getValues('frontView') || '',
      rearView: getValues('rearView') || '',
      driverSide: getValues('driverSide') || '',
      passengerSide: getValues('passengerSide') || '',
      dashboard: getValues('dashboard') || '',
      interiorFront: getValues('interiorFront') || '',
      interiorRear: getValues('interiorRear') || '',
    };
    
    // Update the vehiclePhotos object in the form
    setValue('vehiclePhotos', vehiclePhotos, { shouldDirty: true });
  } catch (error) {
    console.error('Error updating vehicle photos:', error);
  }
};

/**
 * Safely gets a value from the form
 */
const getValue = <T>(
  getValue: UseFormSetValue<CarListingFormData>,
  field: keyof CarListingFormData
): T | undefined => {
  try {
    // This is a workaround since UseFormSetValue doesn't have a getValues method
    // In practice, you would use form.getValues() directly
    const formAny = getValue as any;
    if (formAny._formValues) {
      return formAny._formValues[field] as T;
    }
    return undefined;
  } catch (error) {
    console.error(`Error getting value for ${String(field)}:`, error);
    return undefined;
  }
};

/**
 * Adapts the temporary file uploader to a format compatible with photo sections
 */
export const adaptTemporaryFileUploader = (uploader: any) => {
  return {
    files: uploader.files || [],
    isUploading: uploader.isUploading || false,
    progress: uploader.progress || 0,
    uploadFile: uploader.uploadFile || (() => Promise.resolve(null)),
    uploadFiles: uploader.uploadFiles || ((files: FileList) => Promise.resolve([])),
    removeFile: uploader.removeFile || (() => false),
  };
};
