
/**
 * Changes made:
 * - 2024-06-20: Extracted main form content from FormContent.tsx
 * - Created a standalone component for the form body and controls
 */

import { StepForm } from "../StepForm";
import { FormSubmissionButtons } from "./FormSubmissionButtons";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";

interface MainFormContentProps {
  form: UseFormReturn<CarListingFormData>;
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

export const MainFormContent = ({
  form,
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
  const isLastStep = currentStep === totalSteps - 1;
  
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
};
