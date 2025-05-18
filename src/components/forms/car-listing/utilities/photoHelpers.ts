
/**
 * Photo Helper Utilities
 * Created: 2025-05-12
 * Purpose: Helper functions for handling photo uploads
 * Updated: 2025-08-18 - Added support for rim photos
 * Updated: 2025-08-27 - Fixed type issues with photo upload functions
 * Updated: 2025-08-27 - Added better error handling for uploads
 */

import { UseFormSetValue, UseFormGetValues } from 'react-hook-form';

// Helper to set photo field in a type-safe way
export const setPhotoField = (
  fieldName: string,
  value: string,
  setValue: UseFormSetValue<any>
) => {
  try {
    setValue(`vehiclePhotos.${fieldName}`, value, { shouldDirty: true });
  } catch (error) {
    console.error(`Error setting photo field ${fieldName}:`, error);
  }
};

// Helper to set rim photo field specifically
export const setRimPhotoField = (
  position: string,
  value: string,
  setValue: UseFormSetValue<any>
) => {
  try {
    setValue(`rimPhotos.${position}`, value, { shouldDirty: true });
  } catch (error) {
    console.error(`Error setting rim photo field ${position}:`, error);
  }
};

// Update the vehicle photos object with all photos
export const updateVehiclePhotos = (
  setValue: UseFormSetValue<any>,
  getValues: UseFormGetValues<any>
) => {
  try {
    const vehiclePhotos = getValues('vehiclePhotos') || {};
    const rimPhotos = getValues('rimPhotos') || {};
    
    setValue('vehiclePhotos', {
      ...vehiclePhotos
    }, { shouldDirty: true });
    
    setValue('rimPhotos', {
      ...rimPhotos
    }, { shouldDirty: true });
  } catch (error) {
    console.error("Error updating vehicle photos:", error);
  }
};

// Convert file to base64 for preview
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    } catch (error) {
      reject(new Error("Failed to convert file to base64"));
    }
  });
};

// Generate a unique ID for files
export const generateFileId = (): string => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    // Fallback for browsers without crypto.randomUUID()
    return Math.random().toString(36).substring(2, 11);
  }
};

// Validate image file type and size
export const validateImageFile = (file: File): { valid: boolean; message?: string } => {
  // Check if file is an image
  if (!file.type.startsWith('image/')) {
    return { valid: false, message: 'File must be an image' };
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, message: 'File size exceeds 10MB limit' };
  }
  
  return { valid: true };
};

// Helper to check if all required photos are uploaded
export const areAllRequiredPhotosUploaded = (vehiclePhotos: Record<string, string | undefined>): boolean => {
  const requiredFields = [
    'frontView',
    'rearView',
    'driverSide',
    'passengerSide',
    'dashboard',
    'interiorFront'
  ];
  
  return requiredFields.every(field => 
    vehiclePhotos[field] && vehiclePhotos[field]!.trim() !== ''
  );
};
