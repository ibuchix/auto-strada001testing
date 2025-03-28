
/**
 * Custom hook for handling stepper accessibility logic
 */

import { useCallback } from 'react';

interface UseStepperAccessibilityParams {
  currentStep: number;
  completedSteps: number[];
  visibleSections: string[];
}

export const useStepperAccessibility = ({
  currentStep,
  completedSteps,
  visibleSections
}: UseStepperAccessibilityParams) => {
  
  // Determine if a step is accessible
  const isStepAccessible = useCallback((
    stepId: string, 
    sections: string[], 
    index: number
  ) => {
    // Always make these specific steps accessible
    if (stepId === 'notes' || stepId === 'personal-details') {
      return true;
    }
    
    // For steps with multiple sections, check if any of their sections are visible
    if (Array.isArray(sections)) {
      const hasVisibleSection = sections.some(sectionId => 
        visibleSections.includes(sectionId)
      );
      
      // Require previous steps to be completed first (can only jump backward freely)
      const isPreviousStep = index <= currentStep;
      
      return hasVisibleSection && (isPreviousStep || completedSteps.includes(index - 1));
    }
    
    return false;
  }, [visibleSections, currentStep, completedSteps]);

  // Handlers for accessibility
  const createStepClickHandler = (index: number, isAccessible: boolean, onStepChange: (step: number) => void) => {
    return () => {
      if (isAccessible) {
        onStepChange(index);
      }
    };
  };

  const createStepKeyDownHandler = (index: number, isAccessible: boolean, onStepChange: (step: number) => void) => {
    return (e: React.KeyboardEvent) => {
      if (isAccessible && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onStepChange(index);
      }
    };
  };

  return {
    isStepAccessible,
    createStepClickHandler,
    createStepKeyDownHandler
  };
};
