/**
 * Changes made:
 * - 2027-11-17: Refactored to use a single state object to prevent hook inconsistency
 * - 2027-11-17: Added safeguards against race conditions
 * - 2027-11-17: Made hook calls unconditional
 * - 2027-11-17: Added ability to update save function after initialization
 * - 2027-11-17: Improved error handling and performance
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

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
  // Use a single state object to prevent hook inconsistencies
  const [state, setState] = useState({
    currentStep: initialStep,
    completedSteps: {} as Record<number, boolean>,
    isNavigating: false,
    lastStepChange: Date.now()
  });
  
  // Use a ref for the save progress function to avoid dependency issues
  const saveProgressRef = useRef<(() => Promise<boolean>) | undefined>(saveProgress);
  
  // Method to update the save function after initialization
  const updateSaveFunction = useCallback((newSaveFunction: () => Promise<boolean>) => {
    saveProgressRef.current = newSaveFunction;
  }, []);

  // Validate the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      // Get current step configuration
      const currentStepConfig = filteredSteps[state.currentStep];
      
      // If there's a custom validation function, use it
      if (currentStepConfig?.validate) {
        return currentStepConfig.validate();
      }
      
      // Otherwise use default validation
      return true;
    } catch (error) {
      console.error("Step validation error:", error);
      return false;
    }
  }, [filteredSteps, state.currentStep]);

  // Save progress with error handling
  const saveCurrentProgress = useCallback(async (): Promise<boolean> => {
    if (!saveProgressRef.current) return true;
    
    try {
      return await saveProgressRef.current();
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
      return false;
    }
  }, []);

  // Navigate to a specific step
  const setCurrentStep = useCallback(async (step: number) => {
    // Prevent invalid steps
    if (step < 0 || step >= totalSteps) {
      console.warn(`Invalid step: ${step}. Step must be between 0 and ${totalSteps - 1}`);
      return;
    }
    
    // Prevent navigation while already navigating
    if (state.isNavigating) {
      console.warn("Navigation already in progress, please wait");
      return;
    }
    
    setState(prev => ({ ...prev, isNavigating: true }));
    
    try {
      // Validate current step before navigation
      const isValid = await validateCurrentStep();
      
      if (isValid) {
        // Save progress
        await saveCurrentProgress();
        
        // Mark current step as completed
        setState(prev => ({
          ...prev,
          currentStep: step,
          completedSteps: { ...prev.completedSteps, [prev.currentStep]: true },
          isNavigating: false,
          lastStepChange: Date.now()
        }));
      } else {
        setState(prev => ({ ...prev, isNavigating: false }));
        toast.error("Please fix errors before continuing");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      setState(prev => ({ ...prev, isNavigating: false }));
      toast.error("An error occurred during navigation");
    }
  }, [totalSteps, state.isNavigating, validateCurrentStep, saveCurrentProgress]);

  // Navigate to next step
  const nextStep = useCallback(async () => {
    if (state.currentStep < totalSteps - 1) {
      await setCurrentStep(state.currentStep + 1);
    }
  }, [state.currentStep, totalSteps, setCurrentStep]);

  // Navigate to previous step
  const prevStep = useCallback(async () => {
    if (state.currentStep > 0) {
      await setCurrentStep(state.currentStep - 1);
    }
  }, [state.currentStep, setCurrentStep]);

  return {
    currentStep: state.currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    completedSteps: state.completedSteps,
    isNavigating: state.isNavigating,
    updateSaveFunction
  };
};

// Map of step IDs to form fields for validation tracking
export const STEP_FIELD_MAPPINGS: Record<string, Array<keyof CarListingFormData>> = {
  basic: ['make', 'model', 'year', 'mileage', 'vin'],
  details: ['color', 'transmission', 'fuelType', 'bodyType'],
  features: ['features'],
  condition: ['condition', 'damageReports'],
  pricing: ['price', 'reservePrice'],
  photos: ['uploadedPhotos'],
  seller: ['name', 'email', 'mobileNumber']
};
