
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
 * - 2028-03-28: Fixed isValid variable reference error in finally block
 * - 2028-03-28: Fixed navigation logic to properly handle Next button click
 * - 2028-11-16: Fixed issue with Next button not working by ensuring proper validation flow
 * - 2024-06-25: Improved component communication with better state management
 * - 2025-04-05: Enhanced logging for navigation debugging and fixed race conditions
 */

import { useCallback, useEffect, useRef } from "react";
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
  // Generate a unique ID for this instance to track in logs
  const instanceId = useRef(Math.random().toString(36).substring(2, 8)).current;
  
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
  
  console.log(`[StepNavigation][${instanceId}] Initialized with:`, { 
    currentStep, 
    totalSteps,
    completedSteps: Object.keys(completedSteps).length,
    filteredSteps: filteredSteps.length,
    timestamp: new Date().toISOString()
  });
  
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
  
  // Use a ref to track if a navigation is in progress to prevent race conditions
  const navigationInProgress = useRef(false);
  
  // Timeout ref to enforce navigation timeout safety
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset navigation state in case of stuck state
  useEffect(() => {
    // Safety check to reset navigation state if stuck
    const safetyInterval = setInterval(() => {
      if (navigationInProgress.current) {
        const timeElapsed = Date.now() - (navigationInProgress.current as any);
        if (timeElapsed > 10000) { // 10 seconds
          console.warn(`[StepNavigation][${instanceId}] Navigation state stuck for ${timeElapsed}ms, resetting`);
          navigationInProgress.current = false;
          setNavigating(false);
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(safetyInterval);
  }, [instanceId, setNavigating]);
  
  // Clear any lingering timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);
  
  // Navigate to a specific step
  const setCurrentStep = useCallback(async (step: number) => {
    const navStartTime = performance.now();
    const navRequestId = Math.random().toString(36).substring(2, 8);
    
    // Prevent invalid steps
    if (step < 0 || step >= totalSteps) {
      console.warn(`[StepNavigation][${instanceId}][${navRequestId}] Invalid step: ${step}. Step must be between 0 and ${totalSteps - 1}`);
      return;
    }
    
    // Prevent navigation while already navigating
    if (isNavigating || navigationInProgress.current) {
      console.warn(`[StepNavigation][${instanceId}][${navRequestId}] Navigation already in progress, please wait`);
      toast.info("Please wait", { description: "Navigation already in progress" });
      return;
    }
    
    console.log(`[StepNavigation][${instanceId}][${navRequestId}] Starting navigation from step ${currentStep} to ${step}`);
    
    // Set navigation flags to prevent double-navigation
    navigationInProgress.current = Date.now() as any;
    setNavigating(true);
    
    // Set a timeout to forcibly reset navigation state if it gets stuck
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    navigationTimeoutRef.current = setTimeout(() => {
      if (navigationInProgress.current) {
        console.error(`[StepNavigation][${instanceId}][${navRequestId}] Navigation timeout reached, forcing reset`);
        navigationInProgress.current = false;
        setNavigating(false);
        toast.error("Navigation timed out", {
          description: "Please try again"
        });
      }
    }, 10000); // 10 second timeout
    
    try {
      // For back navigation, we don't need to validate
      if (step < currentStep) {
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Back navigation from ${currentStep} to ${step}, skipping validation`);
        
        try {
          await saveCurrentProgress();
          console.log(`[StepNavigation][${instanceId}][${navRequestId}] Successfully saved progress during back navigation`);
        } catch (saveError) {
          console.error(`[StepNavigation][${instanceId}][${navRequestId}] Error saving progress during back navigation:`, saveError);
          // Continue anyway - back navigation should work even if save fails
        }
        
        markStepComplete(currentStep);
        setStepState(step);
        
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Back navigation completed successfully in ${(performance.now() - navStartTime).toFixed(2)}ms`);
        navigationInProgress.current = false;
        return;
      }
      
      // For forward navigation, validate current step
      console.log(`[StepNavigation][${instanceId}][${navRequestId}] Forward navigation from ${currentStep} to ${step}, validating current step`);
      
      let isValidStep = false;
      try {
        isValidStep = await validateCurrentStep();
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Validation result:`, { isValidStep });
      } catch (validationError) {
        console.error(`[StepNavigation][${instanceId}][${navRequestId}] Validation error:`, validationError);
        isValidStep = false;
      }
      
      if (isValidStep) {
        // Save progress
        try {
          console.log(`[StepNavigation][${instanceId}][${navRequestId}] Saving progress before navigation`);
          await saveCurrentProgress();
          console.log(`[StepNavigation][${instanceId}][${navRequestId}] Successfully saved progress`);
        } catch (saveError) {
          console.error(`[StepNavigation][${instanceId}][${navRequestId}] Error saving progress:`, saveError);
          // Continue anyway - navigation should work even if save fails
        }
        
        // Mark current step as completed and update step
        markStepComplete(currentStep);
        setStepState(step);
        
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Forward navigation completed successfully in ${(performance.now() - navStartTime).toFixed(2)}ms`);
      } else {
        // Show toast notification for validation error
        console.error(`[StepNavigation][${instanceId}][${navRequestId}] Validation failed, cannot proceed`);
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Current form errors:`, form.formState.errors);
        
        // Show the field names with errors
        const errorFieldNames = Object.keys(form.formState.errors);
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Fields with errors:`, errorFieldNames);
        
        toast.error("Please fix errors before continuing", {
          id: "validation-error",
          duration: 3000
        });
      }
    } catch (error) {
      console.error(`[StepNavigation][${instanceId}][${navRequestId}] Navigation error:`, error);
      toast.error("An error occurred during navigation", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      // Always clean up navigation state
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }
      
      navigationInProgress.current = false;
      setNavigating(false);
      
      console.log(`[StepNavigation][${instanceId}][${navRequestId}] Navigation attempt finished in ${(performance.now() - navStartTime).toFixed(2)}ms`);
    }
  }, [
    totalSteps, 
    isNavigating, 
    validateCurrentStep, 
    saveCurrentProgress, 
    markStepComplete,
    setStepState,
    setNavigating,
    currentStep,
    instanceId,
    form.formState.errors
  ]);

  // Navigate to next step
  const nextStep = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      console.log(`[StepNavigation][${instanceId}] Attempting to navigate to next step:`, {
        currentStep,
        nextStep: currentStep + 1,
        totalSteps,
        timestamp: new Date().toISOString()
      });
      await setCurrentStep(currentStep + 1);
    } else {
      console.log(`[StepNavigation][${instanceId}] Already at last step, cannot navigate next`);
    }
  }, [currentStep, totalSteps, setCurrentStep, instanceId]);

  // Navigate to previous step
  const prevStep = useCallback(async () => {
    if (currentStep > 0) {
      console.log(`[StepNavigation][${instanceId}] Navigating to previous step:`, {
        currentStep,
        prevStep: currentStep - 1,
        timestamp: new Date().toISOString()
      });
      await setCurrentStep(currentStep - 1);
    } else {
      console.log(`[StepNavigation][${instanceId}] Already at first step, cannot navigate back`);
    }
  }, [currentStep, setCurrentStep, instanceId]);

  // Helper functions for compatibility with existing code
  const handleNext = useCallback(async () => {
    console.log(`[StepNavigation][${instanceId}] handleNext called at ${new Date().toISOString()}`);
    await nextStep();
    return true;
  }, [nextStep, instanceId]);

  const handlePrevious = useCallback(async () => {
    console.log(`[StepNavigation][${instanceId}] handlePrevious called at ${new Date().toISOString()}`);
    await prevStep();
    return true;
  }, [prevStep, instanceId]);

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
    navigationDisabled: isNavigating || navigationInProgress.current
  };
};

// Re-export STEP_FIELD_MAPPINGS for backward compatibility
export { STEP_FIELD_MAPPINGS };
