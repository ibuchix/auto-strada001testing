/**
 * Hook for detecting changes in form data
 * Created: 2025-06-06 - Fixed type handling for blob objects
 */

import { useState, useCallback, useRef } from 'react';
import { CarListingFormData } from '@/types/forms';

interface UseChangeDetectionResult {
  hasChanges: (formData: CarListingFormData, carId?: string | null) => boolean;
  setLastSavedData: (data: CarListingFormData) => void;
  clearLastSavedData: () => void;
}

export const useChangeDetection = (): UseChangeDetectionResult => {
  // Reference to last saved state to compare against
  const lastSavedDataRef = useRef<string>('');
  const lastSavedCarIdRef = useRef<string | null>(null);
  
  // Helper to safely stringify form data, excluding problematic fields
  const safeStringifyFormData = (data: CarListingFormData): string => {
    try {
      // Create a copy we can safely modify
      const sanitizedData = { ...data };
      
      // Remove fields that don't serialize well (like Files)
      if (sanitizedData.serviceHistoryFiles) {
        // For serviceHistoryFiles, only keep key properties
        sanitizedData.serviceHistoryFiles = (sanitizedData.serviceHistoryFiles as any[])
          .map(file => {
            // If it's a File/Blob object
            if (file instanceof Blob) {
              return {
                filename: 'file' // Use a placeholder since File.name doesn't exist on Blob
              };
            }
            // If it's a file reference object
            if (typeof file === 'object' && file !== null) {
              return {
                id: file.id || '',
                url: file.url || '',
                name: file.name || ''
              };
            }
            // If it's just a string
            return file;
          });
      }
      
      // Skip large binary objects
      if (sanitizedData.uploadedPhotos) {
        sanitizedData.uploadedPhotos = (sanitizedData.uploadedPhotos as any[])
          .map(photo => typeof photo === 'string' ? photo : 'blob');
      }
      
      // Convert to string for comparison
      return JSON.stringify(sanitizedData);
    } catch (error) {
      console.error('Error stringifying form data:', error);
      return Date.now().toString(); // Force a change to be detected
    }
  };
  
  // Check if data has changed
  const hasChanges = useCallback((formData: CarListingFormData, carId?: string | null): boolean => {
    // New car being created (no saved data yet)
    if (!lastSavedDataRef.current) {
      return true;
    }
    
    // Car ID changed - indicate a change
    if (carId !== lastSavedCarIdRef.current) {
      return true;
    }
    
    // Compare actual data
    const currentData = safeStringifyFormData(formData);
    return currentData !== lastSavedDataRef.current;
  }, []);
  
  // Update the last saved data reference
  const setLastSavedData = useCallback((data: CarListingFormData) => {
    lastSavedDataRef.current = safeStringifyFormData(data);
    lastSavedCarIdRef.current = data.id || null;
  }, []);
  
  // Clear the saved data (for reset)
  const clearLastSavedData = useCallback(() => {
    lastSavedDataRef.current = '';
    lastSavedCarIdRef.current = null;
  }, []);
  
  return {
    hasChanges,
    setLastSavedData,
    clearLastSavedData
  };
};
