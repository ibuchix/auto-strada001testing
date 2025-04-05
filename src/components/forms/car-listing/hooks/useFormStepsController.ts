
/**
 * Form Steps Controller Hook
 * - Created 2025-04-09: Extracted from FormContent.tsx to centralize step management
 * - Handles step navigation, progress calculation, and validation
 */

import { useCallback, useMemo, useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useStepNavigation } from "./useStepNavigation";
import { useFormProgress } from "./useFormProgress";
import { useValidationErrorTracking } from "./useValidationErrorTracking";
import { useFilteredSteps } from "./useFilteredSteps";

interface UseFormStepsControllerProps {
  form: UseFormReturn<CarListingFormData>;
  visibleSections: string[];
  currentStep: number;
  totalSteps: number;
  saveProgress: () => Promise<boolean>;
  updateFormState: (updater: any) => void;
}

export const useFormStepsController = ({
  form,
  visibleSections,
  currentStep,
  totalSteps,
  saveProgress,
  updateFormState
}: UseFormStepsControllerProps) => {
  // Form step filtering
  const { filteredSteps, typedStepConfigs } = useFilteredSteps({
    visibleSections,
    setFormState: updateFormState
  });

  // Create a stable initialization object for step navigation
  const stepNavigationConfig = useMemo(() => ({
    form,
    totalSteps,
    initialStep: currentStep,
    saveProgress,
    filteredSteps: typedStepConfigs
  }), [form, totalSteps, currentStep, saveProgress, typedStepConfigs]);

  // Step navigation - use memoized config
  const stepNavigation = useStepNavigation(stepNavigationConfig);
  
  // Update the save function when it changes
  useEffect(() => {
    stepNavigation.updateSaveFunction(saveProgress);
  }, [stepNavigation, saveProgress]);

  // Form progress calculation - use stable props to prevent recreation
  const progressConfig = useMemo(() => ({
    form,
    currentStep: stepNavigation.currentStep,
    filteredStepsArray: filteredSteps,
    completedSteps: stepNavigation.completedSteps,
    totalSteps
  }), [form, stepNavigation.currentStep, filteredSteps, stepNavigation.completedSteps, totalSteps]);
  
  const { calculateFormProgress } = useFormProgress(progressConfig);

  // Validation error tracking - with stable dependency
  const { getStepValidationErrors } = useValidationErrorTracking(form);
  
  // Calculate progress and errors - memoize to prevent recalculation on every render
  const progress = useMemo(() => calculateFormProgress(), [calculateFormProgress]);
  const stepErrors = useMemo(() => getStepValidationErrors(), [getStepValidationErrors]);
  
  // Compute completed steps array - memoize to prevent recalculation
  const completedStepsArray = useMemo(() => {
    return Object.entries(stepNavigation.completedSteps)
      .filter(([, isCompleted]) => isCompleted)
      .map(([step]) => parseInt(step, 10));
  }, [stepNavigation.completedSteps]);
  
  // Create memoized handlers for child components to prevent recreation on every render
  const handleStepChange = useCallback((step: number) => {
    stepNavigation.setCurrentStep(step);
  }, [stepNavigation]);

  return {
    currentStep: stepNavigation.currentStep,
    stepNavigation,
    progress,
    stepErrors,
    completedStepsArray,
    validationErrors: stepNavigation.stepValidationErrors || {},
    handleStepChange,
    filteredSteps
  };
};
