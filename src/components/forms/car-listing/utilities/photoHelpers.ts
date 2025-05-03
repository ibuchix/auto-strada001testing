
/**
 * Photo Helper Utilities
 * Created: 2025-05-12
 * Purpose: Helper functions for handling photo uploads
 */

import { UseFormSetValue, UseFormGetValues } from 'react-hook-form';

// Helper to set photo field in a type-safe way
export const setPhotoField = (
  fieldName: string,
  value: string,
  setValue: UseFormSetValue<any>
) => {
  setValue(`vehiclePhotos.${fieldName}`, value, { shouldDirty: true });
};

// Update the vehicle photos object with all photos
export const updateVehiclePhotos = (
  setValue: UseFormSetValue<any>,
  getValues: UseFormGetValues<any>
) => {
  const vehiclePhotos = getValues('vehiclePhotos') || {};
  
  setValue('vehiclePhotos', {
    ...vehiclePhotos
  }, { shouldDirty: true });
};

// Convert file to base64 for preview
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Generate a unique ID for files
export const generateFileId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
