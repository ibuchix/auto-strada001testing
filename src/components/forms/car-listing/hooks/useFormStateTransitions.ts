
/**
 * Hook to manage form state transitions with performance optimizations
 * 
 * Changes made:
 * - 2025-04-07: Created to handle form state transitions with minimal renders
 * - 2025-04-07: Implemented state batching to reduce re-renders
 * - 2025-04-07: Added improved error handling for state transitions
 */
import { useCallback, useRef } from "react";
import { FormState } from "./useFormState";

interface UseFormStateTransitionsProps {
  updateFormState: (updater: (prev: FormState) => FormState) => void;
}

export const useFormStateTransitions = ({ 
  updateFormState 
}: UseFormStateTransitionsProps) => {
  const pendingUpdatesRef = useRef<Partial<FormState>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Batch form state updates to reduce renders
  const batchFormStateUpdate = useCallback((updates: Partial<FormState>) => {
    // Store updates in the ref
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...updates
    };
    
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set a new timeout to apply all updates at once
    updateTimeoutRef.current = setTimeout(() => {
      updateFormState(prev => ({
        ...prev,
        ...pendingUpdatesRef.current
      }));
      pendingUpdatesRef.current = {};
      updateTimeoutRef.current = null;
    }, 0);
  }, [updateFormState]);
  
  // Handle transitioning to form ready state
  const transitionToReady = useCallback(() => {
    batchFormStateUpdate({
      isInitializing: false,
      hasInitializedHooks: true
    });
  }, [batchFormStateUpdate]);
  
  // Handle transitioning to draft loaded state
  const transitionToDraftLoaded = useCallback((carId: string, lastSaved: Date) => {
    batchFormStateUpdate({
      carId,
      lastSaved,
      isInitializing: false
    });
  }, [batchFormStateUpdate]);
  
  // Handle transitioning to error state
  const transitionToErrorState = useCallback((error: Error) => {
    batchFormStateUpdate({
      isInitializing: false,
      draftLoadError: error
    });
  }, [batchFormStateUpdate]);
  
  return {
    batchFormStateUpdate,
    transitionToReady,
    transitionToDraftLoaded,
    transitionToErrorState
  };
};
