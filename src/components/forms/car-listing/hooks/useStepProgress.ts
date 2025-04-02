
/**
 * Changes made:
 * - 2028-03-27: Extracted progress saving functionality from useStepNavigation
 */

import { useCallback, useRef } from "react";
import { toast } from "sonner";

interface UseStepProgressProps {
  initialSaveFunction?: () => Promise<boolean>;
}

export const useStepProgress = ({
  initialSaveFunction
}: UseStepProgressProps) => {
  // Use a ref for the save progress function to avoid dependency issues
  const saveProgressRef = useRef<(() => Promise<boolean>) | undefined>(initialSaveFunction);
  
  // Method to update the save function after initialization
  const updateSaveFunction = useCallback((newSaveFunction: () => Promise<boolean>) => {
    saveProgressRef.current = newSaveFunction;
  }, []);

  // Save progress with error handling
  const saveCurrentProgress = useCallback(async (): Promise<boolean> => {
    if (!saveProgressRef.current) return true;
    
    try {
      return await saveProgressRef.current();
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress");
      return false;
    }
  }, []);

  return {
    updateSaveFunction,
    saveCurrentProgress
  };
};
