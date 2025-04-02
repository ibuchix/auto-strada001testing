
/**
 * Changes made:
 * - 2027-11-17: Refactored to use a single state object to prevent hook inconsistency
 * - 2027-11-17: Added safeguards against race conditions
 * - 2027-11-17: Made hook calls unconditional
 * - 2027-11-17: Added ability to update save function after initialization
 * - 2027-11-17: Improved error handling and performance
 * - 2027-11-19: Fixed TypeScript return types to ensure compatibility
 * - 2027-11-19: Added validation errors tracking and step error handling
 * - 2027-11-20: Fixed validate function call with proper argument handling
 * - 2028-03-27: Refactored into smaller, more focused hooks
 */

import { useCallback, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { useStepState } from "./useStepState";
import { useStepValidation, STEP_FIELD_MAPPINGS } from "./useStepValidation";
import { useStepProgress } from "./useStepProgress";

interface StepConfig {
  id: string;
  validate?: () => boolean;
}

interface UseStepNavigationProps {
  form: UseFormReturn<CarListingFormData>;
  totalSteps: number;
  initialStep?: number;
  saveProgress?: () => Promise<boolean>;
  filteredSteps: StepConfig[];
}

export const useStepNavigation = ({
  form,
  totalSteps,
  initialStep = 0,
  saveProgress,
  filteredSteps
}: UseStepNavigationProps) => {
  // Use extracted hooks for state management, validation, and progress
  const {
    currentStep,
    completedSteps,
    isNavigating,
    validationErrors,
    stepValidationErrors,
    setCurrentStep: setStepState,
    setNavigating,
    markStepComplete,
    setValidationErrors,
    setStepValidationErrors,
    clearValidationErrors
  } = useStepState({ initialStep });
  
  const { updateSaveFunction, saveCurrentProgress } = useStepProgress({
    initialSaveFunction: saveProgress
  });
  
  const { validateCurrentStep, processFormErrors } = useStepValidation({
    form,
    filteredSteps,
    currentStep,
    setValidationErrors,
    setStepValidationErrors,
    clearValidationErrors
  });
  
  // Navigate to a specific step
  const setCurrentStep = useCallback(async (step: number) => {
    // Prevent invalid steps
    if (step < 0 || step >= totalSteps) {
      console.warn(`Invalid step: ${step}. Step must be between 0 and ${totalSteps - 1}`);
      return;
    }
    
    // Prevent navigation while already navigating
    if (isNavigating) {
      console.warn("Navigation already in progress, please wait");
      return;
    }
    
    setNavigating(true);
    
    try {
      // Validate current step before navigation
      const isValid = await validateCurrentStep();
      
      if (isValid) {
        // Save progress
        await saveCurrentProgress();
        
        // Mark current step as completed and update step
        markStepComplete(currentStep);
        setStepState(step);
      } else {
        setNavigating(false);
        toast.error("Please fix errors before continuing");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setNavigating(false);
      toast.error("An error occurred during navigation");
    } finally {
      if (isValid) {
        setNavigating(false);
      }
    }
  }, [
    totalSteps, 
    isNavigating, 
    validateCurrentStep, 
    saveCurrentProgress, 
    markStepComplete,
    setStepState,
    setNavigating,
    currentStep
  ]);

  // Navigate to next step
  const nextStep = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      await setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, setCurrentStep]);

  // Navigate to previous step
  const prevStep = useCallback(async () => {
    if (currentStep > 0) {
      await setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  // Helper functions for compatibility with existing code
  const handleNext = useCallback(async () => {
    await nextStep();
    return true;
  }, [nextStep]);

  const handlePrevious = useCallback(async () => {
    await prevStep();
    return true;
  }, [prevStep]);

  // Update validation errors when form errors change
  useEffect(() => {
    processFormErrors();
  }, [form.formState.errors, processFormErrors]);

  return {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    completedSteps,
    isNavigating,
    updateSaveFunction,
    validationErrors,
    stepValidationErrors,
    handleNext,
    handlePrevious,
    navigationDisabled: isNavigating
  };
};

// Re-export STEP_FIELD_MAPPINGS for backward compatibility
export { STEP_FIELD_MAPPINGS };
