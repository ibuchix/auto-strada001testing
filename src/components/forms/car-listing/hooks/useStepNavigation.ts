
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
 * - 2025-04-06: Fixed navigation lock with improved reset mechanism and timeout protection
 */

import { useCallback, useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";
import { useStepState } from "./useStepState";
import { useStepValidation, STEP_FIELD_MAPPINGS } from "./useStepValidation";
import { useStepProgress } from "./useStepProgress";
import { usePromiseTracking } from "./usePromiseTracking";
import { TimeoutDurations } from "@/utils/timeoutUtils";

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
  
  // Use promise tracking for navigation operations
  const { trackPromise } = usePromiseTracking('stepNavigation');
  
  // Use a ref to track if a navigation is in progress to prevent race conditions
  // Instead of just a boolean, store an object with timestamp and request ID for better debugging
  const navigationInProgress = useRef<{
    active: boolean;
    timestamp: number;
    requestId: string;
    timeoutId?: NodeJS.Timeout;
  }>({
    active: false,
    timestamp: 0,
    requestId: ''
  });
  
  // Function to safely reset navigation lock with logging
  const resetNavigationLock = useCallback((requestId: string, reason: string) => {
    const wasActive = navigationInProgress.current.active;
    const duration = navigationInProgress.current.timestamp 
      ? Date.now() - navigationInProgress.current.timestamp 
      : 0;
    
    // Clear any existing timeout first
    if (navigationInProgress.current.timeoutId) {
      clearTimeout(navigationInProgress.current.timeoutId);
    }
    
    // Reset the navigation lock
    navigationInProgress.current = {
      active: false,
      timestamp: 0,
      requestId: ''
    };
    
    // Only log if we actually cleared an active lock
    if (wasActive) {
      console.log(`[StepNavigation][${instanceId}] Reset navigation lock:`, {
        requestId,
        reason,
        wasLocked: wasActive,
        durationMs: duration,
        timestamp: new Date().toISOString()
      });
    }
    
    // Always ensure UI navigation state is reset
    setNavigating(false);
  }, [instanceId, setNavigating]);
  
  // Reset navigation state in case of stuck state
  useEffect(() => {
    // Safety check to reset navigation state if stuck
    const safetyInterval = setInterval(() => {
      if (navigationInProgress.current.active) {
        const timeElapsed = Date.now() - navigationInProgress.current.timestamp;
        if (timeElapsed > TimeoutDurations.MEDIUM) { // 10 seconds
          console.warn(`[StepNavigation][${instanceId}] Navigation state stuck for ${timeElapsed}ms, forcibly resetting`, {
            requestId: navigationInProgress.current.requestId,
            startedAt: new Date(navigationInProgress.current.timestamp).toISOString(),
            currentTime: new Date().toISOString()
          });
          
          // Force reset the navigation lock
          resetNavigationLock(navigationInProgress.current.requestId, 'timeout-watchdog');
          
          // Show a toast to inform the user
          toast.error("Navigation timed out", {
            description: "Please try again",
            id: "navigation-timeout-error"
          });
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(safetyInterval);
      
      // Ensure we clear any active navigation lock on unmount
      if (navigationInProgress.current.active) {
        resetNavigationLock('unmount', 'component-unmounted');
      }
    };
  }, [instanceId, resetNavigationLock]);
  
  // Navigate to a specific step
  const setCurrentStep = useCallback(async (step: number) => {
    const navRequestId = Math.random().toString(36).substring(2, 8);
    const navStartTime = performance.now();
    
    console.log(`[StepNavigation][${instanceId}][${navRequestId}] setCurrentStep called:`, {
      requestedStep: step,
      currentStep,
      isNavigating,
      navigationLockActive: navigationInProgress.current.active,
      timestamp: new Date().toISOString()
    });
    
    // Prevent invalid steps
    if (step < 0 || step >= totalSteps) {
      console.warn(`[StepNavigation][${instanceId}][${navRequestId}] Invalid step: ${step}. Step must be between 0 and ${totalSteps - 1}`);
      return;
    }
    
    // Prevent navigation while already navigating
    if (isNavigating || navigationInProgress.current.active) {
      console.warn(`[StepNavigation][${instanceId}][${navRequestId}] Navigation already in progress, please wait`, {
        existingRequestId: navigationInProgress.current.requestId,
        existingTimestamp: navigationInProgress.current.timestamp > 0 
          ? new Date(navigationInProgress.current.timestamp).toISOString()
          : 'none'
      });
      
      toast.info("Please wait", { 
        description: "Navigation already in progress",
        id: "navigation-in-progress"
      });
      return;
    }
    
    // Set navigation flags to prevent double-navigation with enhanced tracking
    navigationInProgress.current = {
      active: true,
      timestamp: Date.now(),
      requestId: navRequestId
    };
    
    // Set UI state
    setNavigating(true);
    
    console.log(`[StepNavigation][${instanceId}][${navRequestId}] Starting navigation from step ${currentStep} to ${step}`);
    
    // Set a timeout to forcibly reset navigation state if it gets stuck
    navigationInProgress.current.timeoutId = setTimeout(() => {
      if (navigationInProgress.current.active && navigationInProgress.current.requestId === navRequestId) {
        console.error(`[StepNavigation][${instanceId}][${navRequestId}] Navigation timeout reached, forcing reset`);
        resetNavigationLock(navRequestId, 'timeout-reached');
        
        toast.error("Navigation timed out", {
          description: "Please try again",
          id: "navigation-timeout"
        });
      }
    }, TimeoutDurations.MEDIUM); // 10 second timeout
    
    try {
      // For back navigation, we don't need to validate
      if (step < currentStep) {
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Back navigation from ${currentStep} to ${step}, skipping validation`);
        
        // Track the save progress promise
        await trackPromise(
          async () => {
            try {
              await saveCurrentProgress();
              console.log(`[StepNavigation][${instanceId}][${navRequestId}] Successfully saved progress during back navigation`);
            } catch (saveError) {
              console.error(`[StepNavigation][${instanceId}][${navRequestId}] Error saving progress during back navigation:`, saveError);
              // Continue anyway - back navigation should work even if save fails
            }
          },
          'saveProgressBackNav'
        );
        
        markStepComplete(currentStep);
        setStepState(step);
        
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Back navigation completed successfully in ${(performance.now() - navStartTime).toFixed(2)}ms`);
        return;
      }
      
      // For forward navigation, validate current step
      console.log(`[StepNavigation][${instanceId}][${navRequestId}] Forward navigation from ${currentStep} to ${step}, validating current step`);
      
      let isValidStep = false;
      try {
        // Track the validation promise
        isValidStep = await trackPromise(
          () => validateCurrentStep(),
          'validateStep'
        );
        
        console.log(`[StepNavigation][${instanceId}][${navRequestId}] Validation result:`, { isValidStep });
      } catch (validationError) {
        console.error(`[StepNavigation][${instanceId}][${navRequestId}] Validation error:`, validationError);
        isValidStep = false;
      }
      
      if (isValidStep) {
        // Save progress
        try {
          console.log(`[StepNavigation][${instanceId}][${navRequestId}] Saving progress before navigation`);
          
          // Track the save progress promise
          await trackPromise(
            () => saveCurrentProgress(),
            'saveProgressForwardNav'
          );
          
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
        
        // Map field names to step fields for better error messaging
        const currentStepId = filteredSteps[currentStep]?.id;
        const fieldsInCurrentStep = currentStepId ? STEP_FIELD_MAPPINGS[currentStepId] || [] : [];
        
        // Find errors specifically in the current step's fields
        const currentStepErrors = errorFieldNames.filter(field => 
          fieldsInCurrentStep.includes(field)
        );
        
        // Show more specific toast message based on field errors
        if (currentStepErrors.length > 0) {
          toast.error(`Please fix errors in: ${currentStepErrors.join(', ')}`, {
            id: "validation-error",
            duration: 5000
          });
        } else {
          toast.error("Please fix form errors before continuing", {
            id: "validation-error-generic",
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error(`[StepNavigation][${instanceId}][${navRequestId}] Navigation error:`, error);
      toast.error("An error occurred during navigation", {
        description: error instanceof Error ? error.message : "Unknown error",
        id: "navigation-error"
      });
    } finally {
      // This must ALWAYS execute to prevent stuck navigation state
      const navEndTime = performance.now();
      console.log(`[StepNavigation][${instanceId}][${navRequestId}] Navigation attempt finished in ${(navEndTime - navStartTime).toFixed(2)}ms`);
      
      // Always reset the navigation lock at the end
      resetNavigationLock(navRequestId, 'operation-complete');
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
    form.formState.errors,
    filteredSteps,
    resetNavigationLock,
    trackPromise
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
    navigationDisabled: isNavigating || navigationInProgress.current.active
  };
};

// Re-export STEP_FIELD_MAPPINGS for backward compatibility
export { STEP_FIELD_MAPPINGS };
