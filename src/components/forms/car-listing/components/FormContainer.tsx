/**
 * Form Container component
 * - Handles displaying the appropriate components for the current step
 */
import { memo } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSections } from "../FormSections";

interface FormContainerProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  isFirstStep: boolean;
  isLastStep: boolean;
  navigationDisabled: boolean;
  isSaving: boolean;
  carId?: string;
  userId: string;
}

export const FormContainer = memo(({
  form,
  currentStep,
  carId,
  userId,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  navigationDisabled,
  isSaving
}: FormContainerProps) => {
  return (
    <div className="form-container">
      <FormSections
        form={form}
        currentStep={currentStep}
        carId={carId}
        userId={userId}
      />
    </div>
  );
});

FormContainer.displayName = 'FormContainer';
