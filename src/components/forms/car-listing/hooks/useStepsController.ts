
/**
 * Steps Controller Hook
 * Created: 2025-07-18
 * Updated: 2025-07-24 - Fixed property names and return values
 * 
 * Provides centralized logic for form step navigation and validation
 */

import { useEffect, useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';
import { useStepNavigation } from './useStepNavigation';
import { useStepValidation } from './useStepValidation';
import { useStepProgress } from './useStepProgress';
import { FormStep } from '../types';

interface UseStepsControllerProps {
  form: UseFormReturn<CarListingFormData>;
  steps: FormStep[];
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onValidationError?: (errors: string[]) => void;
}

export const useStepsController = ({
  form,
  steps,
  initialStep = 0,
  onStepChange,
  onValidationError
}: UseStepsControllerProps) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Step navigation logic
  const {
    goToNextStep,
    goToPrevStep, // This matches the return value from useStepNavigation
    goToStep,
    hasStepErrors,
    getCurrentStepErrors,
    isFirstStep,
    isLastStep
  } = useStepNavigation(form);

  // Step validation logic
  const {
    validateCurrentStep,
    stepErrors,
    validationErrors,
  } = useStepValidation(form, currentStep);

  // Progress tracking
  const {
    progress,
    completedStepsArray,
    updateProgress,
  } = useStepProgress({
    form,
    currentStep
  });
  
  const completedSteps = completedStepsArray;

  // Handle step change with validation
  const handleStepChange = useCallback(async (newStep: number) => {
    // Validate current step if moving forward
    if (newStep > currentStep) {
      const isValid = await validateCurrentStep();
      if (!isValid) {
        if (onValidationError) {
          onValidationError(Object.values(validationErrors).flat());
        }
        return false;
      }
    }
    
    // Update the step
    goToStep(newStep);
    return true;
  }, [currentStep, goToStep, validateCurrentStep, validationErrors, onValidationError]);

  // Update progress when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      updateProgress();
    });
    
    return () => subscription.unsubscribe();
  }, [form, updateProgress]);

  return {
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep: goToPrevStep, // Aliased to match expected property
    goToStep,
    handleStepChange,
    isFirstStep,
    isLastStep,
    validateCurrentStep,
    stepErrors,
    validationErrors,
    hasStepErrors,
    progress,
    completedSteps
  };
};
