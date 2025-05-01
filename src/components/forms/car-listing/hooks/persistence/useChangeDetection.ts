
/**
 * Hook for detecting changes in form data
 * Created: 2025-06-04
 */

import { useRef, useCallback } from "react";
import { CarListingFormData } from "@/types/forms";

// List of fields that change frequently but don't need to trigger saves
const IGNORED_FIELDS = [
  'updated_at', 
  'form_metadata',
  'temp_image_data',
  'temp_uploads'
];

// List of important fields that should always trigger a save when changed
const CRITICAL_FIELDS = [
  'vin',
  'make',
  'model',
  'year',
  'mileage',
  'transmission',
  'fuel_type'
];

export const useChangeDetection = () => {
  // Ref to store the last saved data for comparison
  const lastSavedDataRef = useRef<string>('');
  const lastSavedValuesRef = useRef<Record<string, any>>({});

  // Set the last saved data for future comparisons
  const setLastSavedData = useCallback((data: CarListingFormData) => {
    // Store the full stringified data for complete comparison
    lastSavedDataRef.current = serializeFormData(data);
    
    // Also store individual field values for selective comparison
    const values: Record<string, any> = {};
    Object.keys(data).forEach(key => {
      if (!IGNORED_FIELDS.includes(key)) {
        values[key] = data[key as keyof CarListingFormData];
      }
    });
    lastSavedValuesRef.current = values;
  }, []);

  // Check if the data has changed compared to the last saved data
  const hasChanges = useCallback((data: CarListingFormData, carId?: string): boolean => {
    // New car entries should always save
    if (!carId) return true;
    
    // If we don't have previous data, consider it changed
    if (!lastSavedDataRef.current) return true;
    
    // First, check critical fields for quick decision
    for (const field of CRITICAL_FIELDS) {
      const key = field as keyof CarListingFormData;
      if (data[key] !== undefined && data[key] !== lastSavedValuesRef.current[field]) {
        return true;
      }
    }
    
    // For more thorough check, compare serialized data
    const currentData = serializeFormData(data);
    return currentData !== lastSavedDataRef.current;
  }, []);

  return {
    hasChanges,
    setLastSavedData
  };
};

/**
 * Serializes form data for comparison, excluding metadata fields
 */
const serializeFormData = (formData: CarListingFormData): string => {
  // Create a copy to avoid modifying the original
  const dataToSerialize = { ...formData };
  
  // Remove ignored fields
  IGNORED_FIELDS.forEach(field => {
    delete dataToSerialize[field as keyof CarListingFormData];
  });
  
  // Convert any File or Blob objects to simple indicators
  Object.keys(dataToSerialize).forEach(key => {
    const value = dataToSerialize[key as keyof typeof dataToSerialize];
    if (typeof value === 'object' && value !== null) {
      // Check if it's a File or FileList
      if (value instanceof File || value instanceof Blob) {
        dataToSerialize[key as keyof typeof dataToSerialize] = `file:${value.name}:${value.size}` as any;
      } else if (value instanceof FileList) {
        dataToSerialize[key as keyof typeof dataToSerialize] = `filelist:${value.length}` as any;
      }
    }
  });
  
  return JSON.stringify(dataToSerialize);
};
