
/**
 * Hook for tracking form validation errors
 * - Extracted from FormContent.tsx to isolate validation error logic
 */
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { STEP_FIELD_MAPPINGS } from "./useStepNavigation";
import { formSteps } from "../constants/formSteps";

export const useValidationErrorTracking = (form: UseFormReturn<CarListingFormData>) => {
  // Maps form errors to steps for the form progress indicator
  const getStepValidationErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    if (!formErrors || Object.keys(formErrors).length === 0) {
      return {};
    }

    // Create a map of step indices to error status
    const errorMap: Record<string, boolean> = {};
    
    // For each form step, check if any of its fields have errors
    formSteps.forEach((step, index) => {
      const relevantFields = STEP_FIELD_MAPPINGS[step.id] || [];
      
      // If any field in this step has an error, mark the step as having an error
      const hasStepError = relevantFields.some(field => 
        Object.keys(formErrors).includes(field)
      );
      
      if (hasStepError) {
        errorMap[index] = true;
      }
    });

    return errorMap;
  }, [form.formState.errors]);

  return { getStepValidationErrors };
};
