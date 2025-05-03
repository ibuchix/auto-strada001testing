
/**
 * Form Progress Hook
 * Created: 2025-07-22
 * Updated: 2025-07-27 - Fixed form defaults import
 */

import { useState, useEffect, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { getFormDefaults } from './useFormHelpers';

export function useFormProgress(form: UseFormReturn<CarListingFormData>) {
  const [progress, setProgress] = useState(0);
  
  // Function to calculate form progress
  const calculateProgress = useCallback(() => {
    const values = form.getValues();
    const defaultValues = getFormDefaults();
    
    // Define the sections of the form and their required fields
    const sections = [
      {
        id: 'basic-info',
        fields: ['make', 'model', 'year', 'price'],
        required: true
      },
      {
        id: 'photos',
        fields: ['uploadedPhotos', 'frontView', 'rearView'],
        required: true
      },
      {
        id: 'features',
        fields: ['features'],
        required: false
      },
      {
        id: 'condition',
        fields: ['isDamaged'],
        required: true
      },
      {
        id: 'service-history',
        fields: ['hasServiceHistory', 'serviceHistoryType'],
        required: false
      }
    ];
    
    let completedSections = 0;
    const requiredSectionCount = sections.filter(section => section.required).length;
    
    // Check each section for completion
    sections.forEach(section => {
      const isComplete = section.fields.every(field => {
        const value = values[field as keyof CarListingFormData];
        const defaultValue = defaultValues[field as keyof CarListingFormData];
        
        // Special case for features
        if (field === 'features' && value) {
          const features = value as Record<string, boolean>;
          return Object.values(features).some(v => v === true);
        }
        
        // Special case for uploaded photos
        if (field === 'uploadedPhotos' && Array.isArray(value)) {
          return value.length > 0;
        }
        
        // For boolean values, they must be explicitly set
        if (typeof value === 'boolean') {
          return value !== undefined;
        }
        
        // For other fields, they must be different from default and non-empty
        return value !== defaultValue && 
               value !== undefined && 
               value !== '' && 
               value !== null;
      });
      
      if (isComplete && section.required) {
        completedSections++;
      }
    });
    
    // Calculate progress percentage
    const calculatedProgress = Math.round((completedSections / requiredSectionCount) * 100);
    setProgress(calculatedProgress);
  }, [form]);
  
  // Calculate progress whenever form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      calculateProgress();
    });
    
    // Initial calculation
    calculateProgress();
    
    return () => subscription.unsubscribe();
  }, [form, calculateProgress]);
  
  // Function to manually update progress
  const updateProgress = useCallback(() => {
    calculateProgress();
  }, [calculateProgress]);
  
  return {
    progress,
    updateProgress
  };
}
