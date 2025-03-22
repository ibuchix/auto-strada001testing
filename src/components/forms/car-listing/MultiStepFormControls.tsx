
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "./FormSubmitButton";
import { TransactionStatus } from "@/services/supabase/transactionService";

interface MultiStepFormControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
  onSubmit: () => void;
  isOffline?: boolean;
  transactionStatus?: TransactionStatus;
  forceEnable?: boolean;
}

export const MultiStepFormControls = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isSubmitting,
  isLastStep,
  onSubmit,
  isOffline,
  transactionStatus,
  forceEnable = false
}: MultiStepFormControlsProps) => {
  if (isLastStep) {
    return (
      <FormSubmitButton 
        isSubmitting={isSubmitting} 
        transactionStatus={transactionStatus}
        forceEnable={forceEnable}
      />
    );
  }

  return (
    <div className="flex justify-between pt-4 sticky bottom-0 bg-white dark:bg-gray-900 p-4 shadow-lg rounded-t-lg border-t z-40">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0}
      >
        Previous
      </Button>

      <Button
        type="button"
        onClick={onNext}
        disabled={isSubmitting || isOffline}
      >
        Next Step
      </Button>
    </div>
  );
};
