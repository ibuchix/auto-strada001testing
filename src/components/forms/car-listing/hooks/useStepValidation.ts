
/**
 * Changes made:
 * - 2024-06-21: Extracted validation logic from useStepNavigation
 * - Separated form validation from navigation to improve maintainability
 * - 2025-04-05: Added comprehensive logging for validation debugging
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
  // Generate request ID for logging
  const requestId = Math.random().toString(36).substring(2, 8);
  
  // Process form errors and organize them by step
  const processFormErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    if (!formErrors || Object.keys(formErrors).length === 0) {
      clearValidationErrors();
      return;
    }
    
    console.log(`[StepValidation][${requestId}] Processing form errors:`, {
      errorCount: Object.keys(formErrors).length,
      errorFields: Object.keys(formErrors),
      timestamp: new Date().toISOString()
    });
    
    // Organize errors by step
    const stepErrors: Record<number, string[]> = {};
    const allErrorMessages: string[] = [];
    
    // Map field names to steps and collect error messages
    Object.entries(formErrors).forEach(([fieldName, error]) => {
      const errorMessage = error?.message?.toString() || `Invalid ${fieldName}`;
      allErrorMessages.push(errorMessage);
      
      console.log(`[StepValidation][${requestId}] Field error:`, {
        field: fieldName,
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      // Find which step this field belongs to
      filteredSteps.forEach((step, index) => {
        const fieldsInStep = STEP_FIELD_MAPPINGS[step.id] || [];
        
        if (fieldsInStep.includes(fieldName)) {
          if (!stepErrors[index]) {
            stepErrors[index] = [];
          }
          stepErrors[index].push(errorMessage);
          
          console.log(`[StepValidation][${requestId}] Mapped error to step:`, {
            field: fieldName,
            stepId: step.id,
            stepIndex: index,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
    
    setValidationErrors(allErrorMessages);
    setStepValidationErrors(stepErrors);
    
    console.log(`[StepValidation][${requestId}] Error processing complete:`, {
      totalErrors: allErrorMessages.length,
      stepsWithErrors: Object.keys(stepErrors).length,
      timestamp: new Date().toISOString()
    });
  }, [form.formState.errors, filteredSteps, clearValidationErrors, setValidationErrors, setStepValidationErrors, requestId]);
  
  // Validate the current step with detailed logging
  const validateCurrentStep = useCallback(async () => {
    const validationStartTime = performance.now();
    console.log(`[StepValidation][${requestId}] Starting validation for step ${currentStep}`, {
      timestamp: new Date().toISOString()
    });
    
    try {
      const currentStepConfig = filteredSteps[currentStep];
      if (!currentStepConfig) {
        console.warn(`[StepValidation][${requestId}] No configuration found for step ${currentStep}`);
        return true;
      }
      
      console.log(`[StepValidation][${requestId}] Validating step:`, {
        stepIndex: currentStep,
        stepId: currentStepConfig.id,
        hasCustomValidator: !!currentStepConfig.validate,
        timestamp: new Date().toISOString()
      });
      
      // First check if there's a custom validation function for this step
      if (currentStepConfig.validate) {
        try {
          console.log(`[StepValidation][${requestId}] Running custom validator for step ${currentStepConfig.id}`);
          const isValid = currentStepConfig.validate();
          
          console.log(`[StepValidation][${requestId}] Custom validation result:`, {
            stepId: currentStepConfig.id,
            isValid,
            timestamp: new Date().toISOString()
          });
          
          if (!isValid) {
            console.warn(`[StepValidation][${requestId}] Custom validation failed for step ${currentStepConfig.id}`);
            return false;
          }
        } catch (validatorError) {
          console.error(`[StepValidation][${requestId}] Error in custom validator:`, validatorError);
          return false;
        }
      }
      
      // Then perform form validation for the fields in this step
      const fieldsInStep = STEP_FIELD_MAPPINGS[currentStepConfig.id] || [];
      
      console.log(`[StepValidation][${requestId}] Fields to validate:`, {
        stepId: currentStepConfig.id,
        fields: fieldsInStep,
        timestamp: new Date().toISOString()
      });
      
      if (fieldsInStep.length === 0) {
        console.log(`[StepValidation][${requestId}] No fields to validate for step ${currentStepConfig.id}, skipping validation`);
        return true;
      }
      
      // Trigger validation only for fields in this step
      const validationResult = await form.trigger(fieldsInStep as any);
      
      const validationEndTime = performance.now();
      console.log(`[StepValidation][${requestId}] Validation completed in ${(validationEndTime - validationStartTime).toFixed(2)}ms:`, {
        stepId: currentStepConfig.id,
        result: validationResult,
        timestamp: new Date().toISOString(),
        errors: validationResult ? [] : Object.keys(form.formState.errors),
        fieldsWithErrors: validationResult ? [] : Object.keys(form.formState.errors).filter(key => fieldsInStep.includes(key))
      });
      
      return validationResult;
    } catch (error) {
      console.error(`[StepValidation][${requestId}] Validation error:`, error);
      return false;
    }
  }, [filteredSteps, currentStep, form, requestId]);

  return {
    validateCurrentStep,
    processFormErrors
  };
};
