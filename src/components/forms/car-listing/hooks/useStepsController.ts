
/**
 * Hook for managing form steps
 * Updated: 2025-05-03 - Fixed TypeScript errors related to types and missing properties
 * Updated: 2025-05-04 - Fixed StepErrorRecord import and type issues
 * Updated: 2025-05-04 - Added missing isFirstStep and isLastStep properties to return object
 */
import { useState, useCallback } from 'react';
import { UseFormReturn, FieldValues } from 'react-hook-form';

// Define StepErrorRecord type since it wasn't found in the import
interface StepErrorRecord {
  [key: string]: string[];
}

interface UseStepsControllerProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  steps: any[];
  onValidateStep?: (step: number) => boolean | Promise<boolean>;
}

// Return type defined inline
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

  return {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    hasStepErrors,
    getCurrentStepErrors,
    isFirstStep,
    isLastStep,
    // These properties are needed for rendering steps content
    filteredSteps: steps,
    visibleSections: steps.flatMap(step => step.sections || [])
  };
}
