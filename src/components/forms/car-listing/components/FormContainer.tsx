
/**
 * Changes made:
 * - 2028-11-15: Extracted from StepForm.tsx to create a reusable form container component
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { SwipeNavigation } from "../SwipeNavigation";
import { FormSections } from "../FormSections";

interface FormContainerProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  onNext: () => Promise<void>;
  onPrevious: () => Promise<void>;
  isFirstStep: boolean;
  isLastStep: boolean;
  navigationDisabled: boolean;
  isSaving?: boolean;
  carId?: string;
  userId: string;
}

export const FormContainer = ({
  form,
  currentStep,
  onNext,
  onPrevious,
  isFirstStep,
  isLastStep,
  navigationDisabled,
  isSaving = false,
  carId,
  userId
}: FormContainerProps) => {
  return (
    <div className="form-container min-h-[400px] mb-10">
      <SwipeNavigation
        onNext={onNext}
        onPrevious={onPrevious}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        disabled={navigationDisabled || isSaving}
      >
        <FormSections 
          form={form} 
          currentStep={currentStep}
          carId={carId}
          userId={userId}
        />
      </SwipeNavigation>
    </div>
  );
};
