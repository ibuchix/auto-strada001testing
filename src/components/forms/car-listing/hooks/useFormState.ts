
/**
 * Changes made:
 * - 2024-06-20: Extracted form state management from FormContent.tsx
 * - Created a custom hook to centralize form state management
 * - 2024-06-24: Added memoization to prevent frequent state updates
 * - 2024-08-10: Enhanced memoization strategy for the entire state object
 * - Added reference comparison to prevent unnecessary re-renders
 * - 2025-05-26: Updated to be a wrapper around the FormStateContext
 */

import { useMemo } from "react";
import { useFormState as useContextFormState } from "../context/FormStateContext";

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

export const useFormState = (initialState?: Partial<FormState>) => {
  const { formState, updateFormState } = useContextFormState();
  
  // Return memoized result to prevent unnecessary rerenders
  return useMemo(() => ({
    formState,
    updateFormState
  }), [formState, updateFormState]);
};
