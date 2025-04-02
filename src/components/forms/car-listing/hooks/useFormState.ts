
/**
 * Changes made:
 * - 2024-06-20: Extracted form state management from FormContent.tsx
 * - Created a custom hook to centralize form state management
 * - 2024-06-24: Added memoization to prevent frequent state updates
 * - 2024-08-10: Enhanced memoization strategy for the entire state object
 * - Added reference comparison to prevent unnecessary re-renders
 */

import { useState, useCallback, useMemo, useRef } from "react";

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
  
  // Use a ref to track the previous state for comparison
  const prevStateRef = useRef<FormState>(formState);

  // Memoize the update function to prevent recreating it on each render
  const updateFormState = useCallback((updater: Partial<FormState> | ((prev: FormState) => FormState)) => {
    if (typeof updater === 'function') {
      setFormState(prev => {
        const nextState = updater(prev);
        // Only update if something actually changed
        if (JSON.stringify(nextState) === JSON.stringify(prev)) {
          return prev; // Return previous state reference if nothing changed
        }
        prevStateRef.current = nextState;
        return nextState;
      });
    } else {
      setFormState(prev => {
        const nextState = { ...prev, ...updater };
        // Only update if something actually changed
        if (JSON.stringify(nextState) === JSON.stringify(prev)) {
          return prev; // Return previous state reference if nothing changed
        }
        prevStateRef.current = nextState;
        return nextState;
      });
    }
  }, []);

  // Return memoized result to prevent unnecessary rerenders
  return useMemo(() => ({
    formState,
    updateFormState
  }), [formState, updateFormState]);
};
