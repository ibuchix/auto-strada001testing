
/**
 * Changes made:
 * - 2024-06-21: Created to manage step progress independently from navigation logic
 * - Separated progress tracking from the useStepNavigation hook
 * - 2024-06-26: Fixed circular dependency issue causing infinite renders
 * - Improved memoization of save function to prevent unnecessary re-renders
 * - Added better error handling for progress saving operations
 */

import { useState, useCallback, useRef } from "react";

interface UseStepProgressProps {
  initialSaveFunction?: () => Promise<boolean>;
}

export const useStepProgress = ({ 
  initialSaveFunction 
}: UseStepProgressProps) => {
  // Use a ref for the current save function to avoid re-renders
  const saveFunctionRef = useRef<() => Promise<boolean>>(
    initialSaveFunction || (async () => true)
  );
  
  // Update the save function ref (doesn't trigger re-renders)
  const updateSaveFunction = useCallback((newSaveFunction: () => Promise<boolean>) => {
    saveFunctionRef.current = newSaveFunction;
  }, []);

  // Save current progress using the ref value
  const saveCurrentProgress = useCallback(async (): Promise<boolean> => {
    try {
      return await saveFunctionRef.current();
    } catch (error) {
      console.error("Error saving progress:", error);
      return false;
    }
  }, []);

  return {
    saveCurrentProgress,
    updateSaveFunction
  };
};
