
/**
 * Changes made:
 * - 2028-11-12: Extracted validation error tracking logic from FormContent.tsx
 */

import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { STEP_FIELD_MAPPINGS } from "./useStepValidation";

export const useValidationErrorTracking = (form: UseFormReturn<CarListingFormData>) => {
  // Get validation errors by step for progress tracking
  const getStepValidationErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    const stepErrors: Record<string, boolean> = {};
    
    // Map errors to steps
    Object.keys(formErrors).forEach(fieldName => {
      for (const [stepId, fields] of Object.entries(STEP_FIELD_MAPPINGS)) {
        if ((fields as string[]).includes(fieldName)) {
          stepErrors[stepId] = true;
          break;
        }
      }
    });
    
    return stepErrors;
  }, [form.formState.errors]);
  
  return {
    getStepValidationErrors
  };
};
