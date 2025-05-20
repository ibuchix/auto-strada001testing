
/**
 * Photo Helper Utilities
 * Created: 2025-07-10
 * Updated: 2025-08-18 - Added rim photo helpers
 * Updated: 2025-05-20 - Improved type safety and rim photo handling
 * Updated: 2025-05-21 - Fixed adapter function compatibility, added setPhotoField and updateVehiclePhotos
 * Updated: 2025-05-21 - Fixed spread operator type error when handling rimPhotos
 * Updated: 2025-05-22 - Fixed type compatibility with RimPhotos interface
 * Updated: 2025-05-23 - Enhanced adapter function and added error recovery capabilities
 * Updated: 2025-05-24 - Fixed uploadFiles return type to match PhotoUploaderProps interface
 * Updated: 2025-05-28 - Fixed TypeScript errors with field names
 * Updated: 2025-05-29 - Fixed getValues function issue in setRimPhotoField
 */

import { UseFormSetValue, UseFormGetValues, UseFormReturn } from "react-hook-form";
import { CarListingFormData, RimPhotos } from '@/types/forms';
import { TemporaryFile } from '@/hooks/useTemporaryFileUpload';
import { watchField, setFieldValue, getFieldValue } from "@/utils/formHelpers";

/**
 * Sets a field in the form for rim photos
 */
export const setRimPhotoField = (
  position: string, 
  value: string,
  form: UseFormReturn<CarListingFormData>
): void => {
  try {
    // Get existing rim photos or initialize empty object
    const currentRimPhotos = form.getValues('rimPhotos') || {};
    
    // Make sure currentRimPhotos is treated as a valid object before spreading
    const safeRimPhotos: Partial<RimPhotos> = typeof currentRimPhotos === 'object' && currentRimPhotos !== null 
      ? currentRimPhotos as Partial<RimPhotos>
      : {};
    
    // Update the specific position with type safety
    const updatedRimPhotos = {
      ...safeRimPhotos,
      [position]: value
    };
    
    // Set the updated object back to the form
    form.setValue("rimPhotos", updatedRimPhotos, { shouldDirty: true });
    
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
  fieldName: keyof CarListingFormData,
  value: string,
  setValue: UseFormSetValue<CarListingFormData>
): void => {
  try {
    // Set the value for the specific field
    setValue(fieldName, value, { shouldDirty: true });
    console.log(`Updated photo field: ${String(fieldName)}`);
  } catch (error) {
    console.error(`Error setting photo field ${String(fieldName)}:`, error);
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
 * 
 * This ensures the required PhotoUploaderProps shape with compatible return types
 */
export const adaptTemporaryFileUploader = (uploader: any) => {
  // Validate input to prevent null pointer exceptions
  if (!uploader) {
    console.warn('No uploader provided to adaptTemporaryFileUploader');
    return {
      files: [],
      isUploading: false,
      progress: 0,
      uploadFile: () => Promise.resolve(null),
      uploadFiles: () => Promise.resolve(), // Return Promise<void> instead of Promise<any[]>
      removeFile: () => false,
      finalizeUploads: () => Promise.resolve([]),
    };
  }
  
  // Create a wrapper for uploadFiles that returns void
  const uploadFilesWrapper = async (files: FileList): Promise<void> => {
    try {
      await uploader.uploadFiles(files);
      // Explicitly return void by not returning anything
    } catch (error) {
      console.error('Error in uploadFiles wrapper:', error);
    }
  };
  
  // Create a wrapper for uploadFile to return compatible type
  const uploadFileWrapper = async (file: File): Promise<string> => {
    try {
      const result = await uploader.uploadFile(file);
      return result?.preview || '';
    } catch (error) {
      console.error('Error in uploadFile wrapper:', error);
      return '';
    }
  };
  
  // Create a wrapper for removeFile to ensure boolean return
  const removeFileWrapper = (id: string): boolean => {
    try {
      return !!uploader.removeFile(id);
    } catch (error) {
      console.error('Error in removeFile wrapper:', error);
      return false;
    }
  };
  
  return {
    files: uploader.files || [],
    isUploading: uploader.isUploading || false,
    progress: uploader.progress || 0,
    uploadFile: uploadFileWrapper,
    uploadFiles: uploadFilesWrapper, // Use the wrapper that returns void
    removeFile: removeFileWrapper,
    // Make sure finalizeUploads is always available
    finalizeUploads: uploader.finalizeUploads || ((carId: string) => Promise.resolve([])),
    // Add recovery capabilities
    cleanup: uploader.cleanup || (() => {}),
  };
};
