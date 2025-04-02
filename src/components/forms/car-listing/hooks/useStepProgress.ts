
/**
 * Changes made:
 * - 2024-06-21: Created to manage step progress independently from navigation logic
 * - Separated progress tracking from the useStepNavigation hook
 */

import { useState, useCallback } from "react";

interface UseStepProgressProps {
  initialSaveFunction?: () => Promise<boolean>;
}

export const useStepProgress = ({ 
  initialSaveFunction 
}: UseStepProgressProps) => {
  const [saveProgress, setSaveProgress] = useState<() => Promise<boolean>>(
    initialSaveFunction || (async () => true)
  );
  
  // Update the save function
  const updateSaveFunction = useCallback((newSaveFunction: () => Promise<boolean>) => {
    setSaveProgress(() => newSaveFunction);
  }, []);

  // Save current progress
  const saveCurrentProgress = useCallback(async (): Promise<boolean> => {
    try {
      return await saveProgress();
    } catch (error) {
      console.error("Error saving progress:", error);
      return false;
    }
  }, [saveProgress]);

  return {
    saveCurrentProgress,
    updateSaveFunction
  };
};
