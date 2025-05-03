
/**
 * Form validation hook
 * Created: 2025-07-12
 */

import { useCallback, useState } from "react";
import { UseFormReturn, FieldError, FieldErrorsImpl } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

export const useFormValidation = (form: UseFormReturn<CarListingFormData>) => {
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  
  const validateCurrentStep = useCallback(async () => {
    try {
      // Get the current errors
      const currentErrors = form.formState.errors;
      
      // Validate the form
      const isValid = await form.trigger();
      
      // Process and format errors for display
      const newStepErrors: Record<string, string> = {};
      
      if (!isValid) {
        Object.entries(form.formState.errors).forEach(([field, error]) => {
          if (error) {
            // Handle different error types and extract the message
            let errorMessage: string;
            
            if (typeof error === 'string') {
              errorMessage = error;
            } else if ((error as FieldError).message) {
              errorMessage = (error as FieldError).message;
            } else {
              errorMessage = `${field} is invalid`;
            }
            
            newStepErrors[field] = errorMessage;
            validationErrors[field] = true;
          }
        });
      }
      
      setStepErrors(newStepErrors);
      setValidationErrors({...validationErrors});
      
      return isValid;
    } catch (error) {
      console.error("Error during validation:", error);
      return false;
    }
  }, [form]);
  
  return {
    validateCurrentStep,
    stepErrors,
    validationErrors
  };
};
