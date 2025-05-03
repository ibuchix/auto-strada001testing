
/**
 * Updated: 2025-07-27 - Fixed form defaults import
 */
import { useWatch } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { CarListingFormData } from '@/types/forms';
import { getFormDefaults } from './useFormHelpers';

// Import functions from your existing code
export function useCompletionPercentage(form: any) {
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const formValues = useWatch({ control: form.control });
  
  useEffect(() => {
    if (!formValues) return;
    
    // Default values for comparison
    const defaultValues = getFormDefaults();
    
    // Define required fields in each section
    const requiredFields = {
      'car-details': ['make', 'model', 'year', 'mileage', 'vin'],
      'pricing': ['price', 'reserve_price'],
      'features': ['features'],
      'condition': ['isDamaged'],
      'photos': ['vehiclePhotos'],
      'additional-info': ['numberOfKeys']
    };
    
    // Calculate completion percentage
    let completedSections = 0;
    let totalSections = Object.keys(requiredFields).length;
    
    // Check each section for completion
    for (const [section, fields] of Object.entries(requiredFields)) {
      const isCompleted = fields.every(field => {
        const value = formValues[field];
        
        // Different validation based on field type
        if (field === 'features') {
          // At least one feature should be selected
          return value && Object.values(value).some(Boolean);
        } else if (field === 'vehiclePhotos') {
          // At least one photo should be added
          return value && Object.values(value).some(Boolean);
        } else if (field === 'isDamaged') {
          // Just needs to be defined
          return value !== undefined;
        } else if (typeof value === 'number') {
          // Numeric values have to be greater than 0
          return value > 0;
        } else {
          // String values should be different from default values (empty strings)
          const defaultValue = defaultValues[field as keyof CarListingFormData];
          return value && value !== defaultValue;
        }
      });
      
      if (isCompleted) {
        completedSections++;
      }
    }
    
    // Calculate percentage
    const percentage = Math.round((completedSections / totalSections) * 100);
    setCompletionPercentage(percentage);
    
  }, [form, formValues]);
  
  return completionPercentage;
}
