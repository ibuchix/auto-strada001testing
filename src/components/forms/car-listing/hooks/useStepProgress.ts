
/**
 * Changes made:
 * - 2024-06-21: Created to manage step progress independently from navigation logic
 * - Separated progress tracking from the useStepNavigation hook
 * - 2024-06-26: Fixed circular dependency issue causing infinite renders
 * - 2025-06-02: Fixed interface to include progress and completedStepsArray
 * - Improved memoization of save function to prevent unnecessary re-renders
 * - Added better error handling for progress saving operations
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface UseStepProgressProps {
  form: UseFormReturn<CarListingFormData>;
  filteredSteps: any[];
  visibleSections: string[];
}

export const useStepProgress = ({ 
  form,
  filteredSteps,
  visibleSections
}: UseStepProgressProps) => {
  // Use a ref for the current save function to avoid re-renders
  const saveFunctionRef = useRef<() => Promise<boolean>>(
    async () => true
  );
  
  // Track completion status
  const [completedStepsArray, setCompletedStepsArray] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  
  // Calculate current progress
  const updateProgress = useCallback(() => {
    // Skip if no steps
    if (!filteredSteps || filteredSteps.length === 0) {
      setProgress(0);
      return;
    }
    
    try {
      // Get form values
      const formValues = form.getValues();
      
      // Calculate completed steps
      const completed: number[] = [];
      filteredSteps.forEach((step, index) => {
        // Check if step has required fields
        const hasAllRequired = step.requiredFields ? 
          step.requiredFields.every((field: string) => !!formValues[field as keyof CarListingFormData]) : 
          true;
          
        // Add to completed if all required fields are filled
        if (hasAllRequired) {
          completed.push(index);
        }
      });
      
      // Update state
      setCompletedStepsArray(completed);
      
      // Calculate progress percentage
      const progressPercent = Math.round((completed.length / filteredSteps.length) * 100);
      setProgress(progressPercent);
      
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }, [form, filteredSteps]);
  
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

  // Update progress whenever form values change
  useMemo(() => {
    updateProgress();
  }, [form.formState.isDirty, updateProgress]);

  return {
    saveCurrentProgress,
    updateSaveFunction,
    progress,
    completedStepsArray,
    updateProgress
  };
};
