
/**
 * Hook for managing form steps
 * Updated: 2025-05-03 - Fixed TypeScript errors related to types and missing properties
 */
import { useState, useCallback } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { StepErrorRecord } from '../types';

interface UseStepsControllerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  steps: any[];
  onValidateStep?: (step: number) => boolean | Promise<boolean>;
}

interface UseStepProgressProps {
  currentStep: number;
  totalSteps: number;
  filteredSteps: any[];
  visibleSections: string[];
}

export function useStepsController<T extends FieldValues>({
  form,
  steps,
  onValidateStep
}: UseStepsControllerProps<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepErrors, setStepErrors] = useState<StepErrorRecord>({});

  const totalSteps = steps.length;

  const goToStep = useCallback(async (step: number) => {
    if (step >= 0 && step < totalSteps) {
      // If moving forward, validate current step
      if (step > currentStep && onValidateStep) {
        const isValid = await onValidateStep(currentStep);
        if (!isValid) {
          return;
        }

        // Mark current step as completed
        if (!completedSteps.includes(currentStep)) {
          setCompletedSteps(prev => [...prev, currentStep]);
        }
      }

      setCurrentStep(step);
    }
  }, [currentStep, completedSteps, totalSteps, onValidateStep]);

  const goToNextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const goToPrevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const hasStepErrors = useCallback(() => {
    return Object.keys(stepErrors).length > 0;
  }, [stepErrors]);

  const getCurrentStepErrors = useCallback(() => {
    return stepErrors || {};
  }, [stepErrors]);
  
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  const stepsWithProgress = {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    hasStepErrors,
    getCurrentStepErrors,
    isFirstStep,
    isLastStep,
    // Add these properties for useStepProgress
    filteredSteps: steps,
    visibleSections: steps.flatMap(step => step.sections || [])
  };

  return stepsWithProgress;
}
