
/**
 * Data Processing Hook
 * Created: 2025-05-20
 * 
 * Handles validating and preparing form data for submission
 */

import { useCallback } from 'react';
import { CarListingFormData } from '@/types/forms';

export const useDataProcessing = () => {
  // Validate form data before submission
  const validateFormData = useCallback((formData: CarListingFormData): string | null => {
    // Check for required fields
    if (!formData.make) return "Make is required";
    if (!formData.model) return "Model is required";
    if (!formData.year) return "Year is required";
    
    // Basic validations
    const currentYear = new Date().getFullYear();
    if (formData.year && (formData.year < 1900 || formData.year > currentYear + 1)) {
      return `Year must be between 1900 and ${currentYear + 1}`;
    }
    
    // Add more validations as needed
    
    return null; // No errors
  }, []);
  
  // Prepare data for submission by formatting and cleaning
  const prepareFormData = useCallback((formData: CarListingFormData): CarListingFormData => {
    // Create a copy to avoid mutating the original
    const cleanedData = { ...formData };
    
    // Clean numeric values
    if (typeof cleanedData.mileage === 'string') {
      cleanedData.mileage = parseInt(cleanedData.mileage, 10) || 0;
    }
    
    if (typeof cleanedData.year === 'string') {
      cleanedData.year = parseInt(cleanedData.year, 10) || new Date().getFullYear();
    }
    
    // Format data as needed
    if (cleanedData.make) {
      cleanedData.make = cleanedData.make.trim();
    }
    
    if (cleanedData.model) {
      cleanedData.model = cleanedData.model.trim();
    }
    
    // Generate a title if not provided
    if (!cleanedData.title && cleanedData.make && cleanedData.model && cleanedData.year) {
      cleanedData.title = `${cleanedData.year} ${cleanedData.make} ${cleanedData.model}`;
    }
    
    return cleanedData;
  }, []);
  
  return {
    validateFormData,
    prepareFormData
  };
};
