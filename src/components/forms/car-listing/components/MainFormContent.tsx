
/**
 * Changes made:
 * - 2024-06-20: Extracted main form content from FormContent.tsx
 * - Created a standalone component for the form body and controls
 * - 2024-06-24: Added React.memo to prevent unnecessary rerenders
 * - 2024-06-25: Updated to use FormDataContext instead of prop drilling
 */

import { StepForm } from "../StepForm";
import { FormSubmissionButtons } from "./FormSubmissionButtons";
import { memo, useMemo } from "react";
import { useFormData } from "../context/FormDataContext";
import { CarListingFormData } from "@/types/forms";

interface MainFormContentProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  saveProgress: () => Promise<boolean>;
  visibleSections: string[];
  totalSteps: number;
  onSaveAndContinue: () => Promise<void>;
  onSave: () => Promise<void>;
}

export const MainFormContent = memo(({
  currentStep,
  setCurrentStep,
  carId,
  lastSaved,
  isOffline,
  isSaving,
  isSubmitting,
  saveProgress,
  visibleSections,
  totalSteps,
  onSaveAndContinue,
  onSave
}: MainFormContentProps) => {
  // Get form from context instead of props
  const form = useFormData();
  
  // Memoize computed values
  const isLastStep = useMemo(() => currentStep === totalSteps - 1, [currentStep, totalSteps]);
  
  return (
    <>
      <StepForm
        form={form}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        carId={carId}
        lastSaved={lastSaved}
        isOffline={isOffline}
        isSaving={isSaving || isSubmitting}
        saveProgress={saveProgress}
        visibleSections={visibleSections}
      />
      
      <FormSubmissionButtons
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
        isSaving={isSaving}
        isOffline={isOffline}
        onSaveAndContinue={onSaveAndContinue}
        onSave={onSave}
        currentStep={currentStep}
      />
    </>
  );
});

// Add display name for React DevTools
MainFormContent.displayName = "MainFormContent";
