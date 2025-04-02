
/**
 * Changes made:
 * - 2024-06-21: Extracted validation logic from useStepNavigation
 * - Separated form validation from navigation to improve maintainability
 */

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "../constants/formSteps";

// Maps step IDs to form field names for validation
export const STEP_FIELD_MAPPINGS: Record<string, string[]> = {
  "vehicle-info": ["make", "model", "year", "mileage", "vin", "transmission"],
  "vehicle-status": ["isDamaged", "hasWarningLights", "hasOutstandingFinance"],
  "personal-details": ["name", "address", "mobileNumber"],
  "features": ["features"],
  "service-history": ["serviceHistoryType", "serviceHistoryFiles"],
  "photos": ["uploadedPhotos", "mainPhoto"],
  // Add mappings for other steps as needed
};

interface UseStepValidationProps {
  form: UseFormReturn<CarListingFormData>;
  filteredSteps: Array<{
    id: string;
    validate?: () => boolean;
  }>;
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
  // Process form errors and organize them by step
  const processFormErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    if (!formErrors || Object.keys(formErrors).length === 0) {
      clearValidationErrors();
      return;
    }
    
    // Organize errors by step
    const stepErrors: Record<number, string[]> = {};
    const allErrorMessages: string[] = [];
    
    // Map field names to steps and collect error messages
    Object.entries(formErrors).forEach(([fieldName, error]) => {
      const errorMessage = error?.message?.toString() || `Invalid ${fieldName}`;
      allErrorMessages.push(errorMessage);
      
      // Find which step this field belongs to
      filteredSteps.forEach((step, index) => {
        const fieldsInStep = STEP_FIELD_MAPPINGS[step.id] || [];
        
        if (fieldsInStep.includes(fieldName)) {
          if (!stepErrors[index]) {
            stepErrors[index] = [];
          }
          stepErrors[index].push(errorMessage);
        }
      });
    });
    
    setValidationErrors(allErrorMessages);
    setStepValidationErrors(stepErrors);
  }, [form.formState.errors, filteredSteps, clearValidationErrors, setValidationErrors, setStepValidationErrors]);
  
  // Validate the current step
  const validateCurrentStep = useCallback(async () => {
    try {
      const currentStepConfig = filteredSteps[currentStep];
      if (!currentStepConfig) return true;
      
      // First check if there's a custom validation function for this step
      if (currentStepConfig.validate) {
        const isValid = currentStepConfig.validate();
        if (!isValid) return false;
      }
      
      // Then perform form validation for the fields in this step
      const fieldsInStep = STEP_FIELD_MAPPINGS[currentStepConfig.id] || [];
      
      // Trigger validation only for fields in this step
      const validationResult = await form.trigger(fieldsInStep as any);
      
      return validationResult;
    } catch (error) {
      console.error("Validation error:", error);
      return false;
    }
  }, [filteredSteps, currentStep, form]);

  return {
    validateCurrentStep,
    processFormErrors
  };
};
