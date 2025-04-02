
/**
 * Changes made:
 * - 2024-06-21: Created to manage step validation independently from navigation logic
 * - Separated validation logic from the useStepNavigation hook
 */

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

// Define step field mappings for validation
export const STEP_FIELD_MAPPINGS: Record<string, string[]> = {
  "0": ["make", "model", "year", "vin"],
  "1": ["name", "address", "mobileNumber"],
  "2": ["isDamaged", "damageReports"],
  "3": ["features"],
  "4": ["serviceHistoryType", "serviceHistoryFiles"],
  "5": ["seatMaterial", "numberOfKeys"],
  "6": ["uploadedPhotos"],
  "7": ["rimPhotosComplete"],
  "8": ["sellerNotes"]
};

interface UseStepValidationProps {
  form: UseFormReturn<CarListingFormData>;
  filteredSteps: { id: string; validate?: () => boolean }[];
  currentStep: number;
  setValidationErrors: (errors: string[]) => void;
  setStepValidationErrors: (errors: Record<number, string[]>) => void;
  clearValidationErrors: () => void;
}

export const useStepValidation = ({
  form,
  filteredSteps,
  currentStep,
  setValidationErrors,
  setStepValidationErrors,
  clearValidationErrors
}: UseStepValidationProps) => {
  
  // Process form errors to create field-specific error messages
  const processFormErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    const errorMessages: Record<number, string[]> = {};
    
    // Map errors to steps
    Object.entries(formErrors).forEach(([fieldName, error]) => {
      for (let i = 0; i < filteredSteps.length; i++) {
        const stepId = i.toString();
        const fields = STEP_FIELD_MAPPINGS[stepId] || [];
        
        if (fields.includes(fieldName) && error?.message) {
          if (!errorMessages[i]) {
            errorMessages[i] = [];
          }
          errorMessages[i].push(`${fieldName}: ${error.message}`);
        }
      }
    });
    
    setStepValidationErrors(errorMessages);
    
    // Set current step validation errors
    const currentStepErrors = errorMessages[currentStep] || [];
    setValidationErrors(currentStepErrors);
    
  }, [form.formState.errors, filteredSteps, currentStep, setValidationErrors, setStepValidationErrors]);

  // Validate the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    clearValidationErrors();
    
    try {
      // Get validate function for current step
      const stepConfig = filteredSteps[currentStep];
      const validateFn = stepConfig?.validate;
      
      // If there's no validate function, treat as valid
      if (!validateFn) {
        return true;
      }
      
      // Run custom validation if provided
      const isCustomValid = validateFn();
      if (!isCustomValid) {
        return false;
      }
      
      // Get fields for current step
      const stepId = currentStep.toString();
      const fields = STEP_FIELD_MAPPINGS[stepId] || [];
      
      if (fields.length === 0) {
        return true;
      }
      
      // Check field validation using form.trigger
      const isValid = await form.trigger(fields as any);
      
      if (!isValid) {
        processFormErrors();
      }
      
      return isValid;
    } catch (error) {
      console.error("Step validation error:", error);
      return false;
    }
  }, [filteredSteps, currentStep, form, clearValidationErrors, processFormErrors]);

  return {
    validateCurrentStep,
    processFormErrors
  };
};
