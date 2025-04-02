
/**
 * Changes made:
 * - 2028-03-27: Extracted step state management from useStepNavigation
 */

import { useState } from "react";

interface StepStateProps {
  initialStep: number;
}

export const useStepState = ({ initialStep }: StepStateProps) => {
  // Use a single state object to prevent hook inconsistencies
  const [state, setState] = useState({
    currentStep: initialStep,
    completedSteps: {} as Record<number, boolean>,
    isNavigating: false,
    lastStepChange: Date.now(),
    validationErrors: [] as string[],
    stepValidationErrors: {} as Record<string, boolean>
  });
  
  const setCurrentStepState = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  };
  
  const setNavigatingState = (isNavigating: boolean) => {
    setState(prev => ({
      ...prev,
      isNavigating
    }));
  };
  
  const markStepComplete = (step: number) => {
    setState(prev => ({
      ...prev,
      completedSteps: { ...prev.completedSteps, [step]: true }
    }));
  };
  
  const setValidationErrors = (errors: string[]) => {
    setState(prev => ({ 
      ...prev, 
      validationErrors: errors
    }));
  };
  
  const setStepValidationErrors = (stepErrors: Record<string, boolean>) => {
    setState(prev => ({ 
      ...prev, 
      stepValidationErrors: stepErrors 
    }));
  };
  
  const clearValidationErrors = () => {
    setState(prev => ({ 
      ...prev, 
      validationErrors: [], 
      stepValidationErrors: {} 
    }));
  };

  return {
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    isNavigating: state.isNavigating,
    validationErrors: state.validationErrors,
    stepValidationErrors: state.stepValidationErrors,
    lastStepChange: state.lastStepChange,
    setCurrentStep: setCurrentStepState,
    setNavigating: setNavigatingState,
    markStepComplete,
    setValidationErrors,
    setStepValidationErrors,
    clearValidationErrors,
    setState
  };
};
