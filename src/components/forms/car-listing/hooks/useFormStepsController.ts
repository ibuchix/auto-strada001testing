
/**
 * Changes made:
 * - 2025-06-01: Fixed potential error when postMessage fails
 * - 2025-06-02: Fixed TypeScript errors with hook arguments and return values
 * - 2025-05-07: Fixed UseStepProgressProps compatibility issue
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { useStepNavigation, STEP_FIELD_MAPPINGS } from './useStepNavigation';
import { useFilteredSteps } from './useFilteredSteps';
import { useStepValidation } from './useStepValidation';
import { useStepProgress } from './useStepProgress';

interface UseFormStepsControllerProps {
  form: UseFormReturn<CarListingFormData>;
  visibleSections: string[];
  currentStep: number;
  totalSteps: number;
  saveProgress?: () => Promise<boolean>;
  updateFormState: (state: any) => void;
}

// Updated interface for UseStepProgressProps
interface UseStepProgressProps {
  form: any;
  filteredSteps: any[];
  visibleSections: string[];
}

export const useFormStepsController = ({
  form,
  visibleSections,
  currentStep: initialStep,
  totalSteps: initialTotalSteps,
  saveProgress,
  updateFormState
}: UseFormStepsControllerProps) => {
  const {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    hasStepErrors,
    getCurrentStepErrors
  } = useStepNavigation(form);

  // Filter steps based on visible sections
  const { filteredSteps } = useFilteredSteps({ 
    visibleSections, 
    setFormState: updateFormState 
  });

  // Step validation logic
  const {
    validateCurrentStep,
    stepErrors,
    validationErrors
  } = useStepValidation(form, currentStep);

  // Progress tracking - pass both filteredSteps and visibleSections
  const {
    progress,
    completedStepsArray,
    updateProgress,
    saveCurrentProgress,
    updateSaveFunction
  } = useStepProgress({
    form,
    filteredSteps,
    visibleSections
  } as UseStepProgressProps); // Cast to UseStepProgressProps to ensure compatibility

  // Set save function if provided
  useEffect(() => {
    if (saveProgress) {
      updateSaveFunction(saveProgress);
    }
  }, [saveProgress, updateSaveFunction]);

  // Update form state when step changes
  useEffect(() => {
    try {
      // Only update if values are different
      if (currentStep !== initialStep || totalSteps !== initialTotalSteps) {
        updateFormState({ 
          currentStep, 
          totalSteps: filteredSteps.length || initialTotalSteps 
        });
      }
    } catch (error) {
      console.error('Error updating form state with step:', error);
    }
  }, [currentStep, totalSteps, initialStep, initialTotalSteps, filteredSteps.length, updateFormState]);

  // Handle step change with validation
  const handleStepChange = useCallback(async (newStep: number) => {
    try {
      // Validate current step if moving forward
      if (newStep > currentStep) {
        const isValid = await validateCurrentStep();
        if (!isValid) return false;
      }
      
      // Save progress before changing step
      if (saveProgress) {
        await saveProgress().catch(err => {
          console.warn('Failed to save progress during step change:', err);
          // Continue with step change even if save fails
        });
      }
      
      // Update the step
      goToStep(newStep);
      return true;
    } catch (error) {
      console.error('Error during step change:', error);
      return false;
    }
  }, [currentStep, goToStep, saveProgress, validateCurrentStep]);

  return {
    currentStep,
    progress,
    stepErrors,
    completedStepsArray,
    validationErrors,
    handleStepChange,
    filteredSteps: filteredSteps,
    goToNextStep,
    goToPrevStep
  };
};
