/**
 * Changes made:
 * - 2028-03-27: Extracted step validation logic from useStepNavigation
 */

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

interface StepConfig {
  id: string;
  validate?: () => boolean;
}

interface UseStepValidationProps {
  form: UseFormReturn<CarListingFormData>;
  filteredSteps: StepConfig[];
  currentStep: number;
  setValidationErrors: (errors: string[]) => void;
  setStepValidationErrors: (stepErrors: Record<string, boolean>) => void;
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
  // Validate the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      // Get current step configuration
      const currentStepConfig = filteredSteps[currentStep];
      
      // If there's a custom validation function, use it
      if (currentStepConfig?.validate) {
        // Call the validate function without arguments
        return currentStepConfig.validate();
      }
      
      // Otherwise use default validation
      return true;
    } catch (error) {
      console.error("Step validation error:", error);
      return false;
    }
  }, [filteredSteps, currentStep]);

  // Process form errors and update validation state
  const processFormErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    
    if (Object.keys(formErrors).length > 0) {
      // Extract error messages
      const errors: string[] = [];
      Object.entries(formErrors).forEach(([field, error]) => {
        if (error?.message) {
          errors.push(`${field}: ${error.message}`);
        }
      });
      
      // Update validation errors state
      setValidationErrors(errors);
      
      // Track which steps have errors
      const stepErrors: Record<string, boolean> = {};
      Object.keys(formErrors).forEach(fieldName => {
        for (const [stepId, fields] of Object.entries(STEP_FIELD_MAPPINGS)) {
          if ((fields as string[]).includes(fieldName)) {
            stepErrors[stepId] = true;
            break;
          }
        }
      });
      
      setStepValidationErrors(stepErrors);
    } else {
      clearValidationErrors();
    }
  }, [form.formState.errors, setValidationErrors, setStepValidationErrors, clearValidationErrors]);

  return {
    validateCurrentStep,
    processFormErrors
  };
};

// Map of step IDs to form fields for validation tracking
export const STEP_FIELD_MAPPINGS: Record<string, Array<string>> = {
  'vehicle-details': ['make', 'model', 'year', 'mileage', 'vin'],
  'details': ['color', 'transmission', 'fuelType', 'bodyType'],
  'features': ['features'],
  'condition': ['condition', 'damageReports'],
  'pricing': ['price', 'reservePrice'],
  'photos': ['uploadedPhotos'],
  'seller': ['name', 'email', 'mobileNumber']
};
