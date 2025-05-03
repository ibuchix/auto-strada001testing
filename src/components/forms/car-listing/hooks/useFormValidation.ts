
/**
 * Form validation hook
 * Created: 2025-07-12
 */

import { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from "@/types/forms";

export const useFormValidation = (
  form: UseFormReturn<CarListingFormData>,
  currentStep: number
) => {
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  
  // Validate the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      // This is simplified - in a real application you would check specific fields per step
      const isValid = await form.trigger();
      
      if (!isValid) {
        // Get all errors from the form
        const errors = form.formState.errors;
        const errorObj: Record<string, string> = {};
        
        // Convert errors to a simple object
        Object.keys(errors).forEach(key => {
          const error = errors[key as keyof typeof errors];
          if (error) {
            errorObj[key] = error.message || 'Field has an error';
          }
        });
        
        setStepErrors(errorObj);
        setValidationErrors(Object.keys(errors).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {} as Record<string, boolean>));
        
        return false;
      }
      
      // Clear errors if valid
      setStepErrors({});
      setValidationErrors({});
      return true;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }, [form, currentStep]);
  
  return {
    validateCurrentStep,
    stepErrors,
    validationErrors,
  };
};
