
/**
 * Changes made:
 * - 2024-06-20: Extracted form state management from FormContent.tsx
 * - Created a custom hook to centralize form state management
 * - 2024-06-24: Added memoization to prevent frequent state updates
 */

import { useState, useCallback, useMemo } from "react";

export interface FormState {
  isInitializing: boolean;
  currentStep: number;
  lastSaved: Date | null;
  carId?: string;
  draftLoadError: Error | null;
  filteredStepsArray: Array<any>;
  totalSteps: number;
  hasInitializedHooks: boolean;
}

const defaultFormState: FormState = {
  isInitializing: true,
  currentStep: 0,
  lastSaved: null,
  carId: undefined,
  draftLoadError: null,
  filteredStepsArray: [],
  totalSteps: 1,
  hasInitializedHooks: false
};

export const useFormState = (initialState?: Partial<FormState>) => {
  const [formState, setFormState] = useState<FormState>({
    ...defaultFormState,
    ...initialState
  });

  // Memoize the update function to prevent recreating it on each render
  const updateFormState = useCallback((updater: Partial<FormState> | ((prev: FormState) => FormState)) => {
    if (typeof updater === 'function') {
      setFormState(updater);
    } else {
      setFormState(prev => ({ ...prev, ...updater }));
    }
  }, []);

  // Return memoized result to prevent unnecessary rerenders
  return useMemo(() => ({
    formState,
    updateFormState
  }), [formState, updateFormState]);
};
