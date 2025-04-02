
/**
 * Changes made:
 * - 2028-11-12: Extracted progress calculation logic from FormContent.tsx
 */

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { getFormDefaults } from "./useFormDefaults";
import { STEP_FIELD_MAPPINGS } from "./useStepValidation";

interface UseFormProgressProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  filteredStepsArray: Array<any>;
  completedSteps: Record<number, boolean>;
  totalSteps: number;
}

export const useFormProgress = ({
  form,
  currentStep,
  filteredStepsArray,
  completedSteps,
  totalSteps
}: UseFormProgressProps) => {

  // Calculate form progress based on completed steps and current form data
  const calculateFormProgress = useCallback(() => {
    const formValues = form.getValues();
    const defaultValues = getFormDefaults();
    let totalFields = 0;
    let completedFields = 0;
    
    // Count all fields in the form that are visible in current step and previous steps
    Object.entries(formValues).forEach(([key, value]) => {
      if (key === 'seller_id' || key === 'valuation_data' || key === 'form_metadata') return; // Skip system fields
      
      // Only count fields from visible sections
      let fieldIsInVisibleSection = false;
      
      // Check if field is relevant to current or previous steps
      for (let i = 0; i <= currentStep; i++) {
        if (i >= filteredStepsArray.length) continue;
        
        const stepId = filteredStepsArray[i]?.id;
        if (!stepId) continue;
        
        const fieldsInStep = STEP_FIELD_MAPPINGS[stepId] || [];
        if ((fieldsInStep as string[]).includes(key)) {
          fieldIsInVisibleSection = true;
          break;
        }
      }
      
      if (!fieldIsInVisibleSection) return;
      
      totalFields++;
      
      // Get default value for comparison
      const defaultValue = defaultValues[key as keyof typeof defaultValues];
      
      // Compare with default value to see if it's been modified
      const isModified = (() => {
        // Skip empty values
        if (value === undefined || value === null || value === '') {
          return false;
        }
        
        // For arrays, check if non-empty and different from default
        if (Array.isArray(value)) {
          if (value.length === 0) return false;
          
          // If default is also an array, compare contents
          if (Array.isArray(defaultValue) && defaultValue.length === value.length) {
            // Deep comparison would be better, but for simplicity checking length
            return true; // Consider any array with items as modified
          }
          
          return true;
        } 
        
        // For objects like features, check if any property differs from default
        if (typeof value === 'object' && value !== null) {
          if (typeof defaultValue === 'object' && defaultValue !== null) {
            // For features object, check if any feature is enabled that's not default
            return Object.entries(value).some(([propKey, propValue]) => {
              const defaultPropValue = defaultValue[propKey as keyof typeof defaultValue];
              return propValue !== defaultPropValue && propValue !== false;
            });
          }
          return Object.values(value).some(v => Boolean(v));
        } 
        
        // For primitive values
        if (typeof value === 'string' && value.trim() === '') return false;
        if (value === defaultValue) return false;
        
        // Consider number values as modified even if they're 0
        if (typeof value === 'number') return true;
        
        // All other truthy values
        return Boolean(value);
      })();
      
      if (isModified) {
        completedFields++;
      }
    });
    
    // Calculate more accurate percentage based on fields
    let progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    // Factor in step completion - give more weight to step completion as user progresses
    const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
    const stepProgress = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;
    
    // Weight the progress more toward field completion at the beginning
    // and more toward step completion at the end
    const stepRatio = Math.min(currentStep / (totalSteps - 1), 1);
    progress = Math.round(progress * (1 - stepRatio * 0.5) + stepProgress * (stepRatio * 0.5));
    
    // Ensure minimum progress is shown when form is started (psychological benefit)
    return Math.max(progress, currentStep > 0 ? 10 : 5);
  }, [form, currentStep, filteredStepsArray, completedSteps, totalSteps]);

  return {
    calculateFormProgress
  };
};
