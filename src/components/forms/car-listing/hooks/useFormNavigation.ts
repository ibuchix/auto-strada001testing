
/**
 * Hook for managing form navigation state
 * Created: 2025-07-02
 */

import { useState, useCallback, useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

export interface FormNavigationState {
  completedSteps: number[];
  visitedSteps: number[];
}

export const useFormNavigation = (steps: any[]) => {
  const [navState, setNavState] = useState<FormNavigationState>({
    completedSteps: [],
    visitedSteps: [0], // First step is always visited by default
  });

  const markStepVisited = useCallback((stepIndex: number) => {
    setNavState(prev => ({
      ...prev,
      visitedSteps: [...new Set([...prev.visitedSteps, stepIndex])],
    }));
  }, []);

  const markStepCompleted = useCallback((stepIndex: number) => {
    setNavState(prev => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, stepIndex])],
    }));
  }, []);

  const isStepCompleted = useCallback(
    (stepIndex: number) => navState.completedSteps.includes(stepIndex),
    [navState.completedSteps]
  );

  const isStepVisited = useCallback(
    (stepIndex: number) => navState.visitedSteps.includes(stepIndex),
    [navState.visitedSteps]
  );

  const canNavigateToStep = useCallback(
    (stepIndex: number) => {
      // Can always navigate to first step
      if (stepIndex === 0) return true;
      
      // Can only navigate to steps that are immediately after the last completed step
      // or to steps that have been visited before
      const lastCompletedStep = Math.max(0, ...navState.completedSteps);
      return stepIndex <= lastCompletedStep + 1 || isStepVisited(stepIndex);
    },
    [navState.completedSteps, isStepVisited]
  );

  return {
    canNavigateToStep,
    markStepVisited,
    markStepCompleted,
    isStepCompleted,
    isStepVisited,
    navState,
  };
};
