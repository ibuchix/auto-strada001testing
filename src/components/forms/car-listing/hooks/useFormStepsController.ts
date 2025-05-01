
/**
 * Changes made:
 * - 2025-06-01: Fixed potential error when postMessage fails
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
  const { filteredSteps } = useFilteredSteps(STEP_FIELD_MAPPINGS, visibleSections);

  // Step validation logic
  const {
    validateCurrentStep,
    stepErrors,
    validationErrors
  } = useStepValidation(form, currentStep);

  // Progress tracking
  const {
    progress,
    completedStepsArray,
    updateProgress
  } = useStepProgress(form, filteredSteps, visibleSections);

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
