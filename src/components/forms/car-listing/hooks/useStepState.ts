
/**
 * Changes made:
 * - 2024-06-21: Created to manage step state independently from navigation logic
 * - Separated state management from the useStepNavigation hook
 */

import { useState, useCallback, useMemo } from "react";

interface UseStepStateProps {
  initialStep?: number;
}

export const useStepState = ({ initialStep = 0 }: UseStepStateProps) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [isNavigating, setNavigating] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<number, string[]>>({});
  
  // Track which steps have been completed
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  
  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [step]: true
    }));
  }, []);
  
  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);
  
  // Get a memoized array of completed step numbers
  const completedStepsArray = useMemo(() => {
    return Object.entries(completedSteps)
      .filter(([_, isCompleted]) => isCompleted)
      .map(([step]) => parseInt(step, 10));
  }, [completedSteps]);

  return {
    currentStep,
    setCurrentStep,
    isNavigating,
    setNavigating,
    validationErrors,
    setValidationErrors,
    stepValidationErrors,
    setStepValidationErrors,
    completedSteps,
    completedStepsArray,
    markStepComplete,
    clearValidationErrors
  };
};
