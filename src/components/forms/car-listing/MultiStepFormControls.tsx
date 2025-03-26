
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "./FormSubmitButton";
import { TransactionStatus } from "@/services/supabase/transactionService";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface MultiStepFormControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
  transactionStatus?: TransactionStatus | null;
  forceEnable?: boolean;
  onRetry?: () => void;
  diagnosticId?: string;
}

export const MultiStepFormControls = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  isLastStep,
  transactionStatus,
  forceEnable,
  onRetry,
  diagnosticId
}: MultiStepFormControlsProps) => {
  return (
    <div className="w-full mt-8">
      {isLastStep ? (
        <FormSubmitButton 
          isSubmitting={isSubmitting} 
          transactionStatus={transactionStatus}
          forceEnable={forceEnable}
          onRetry={onRetry}
          diagnosticId={diagnosticId}
        />
      ) : (
        <div className="flex justify-between mt-8">
          <Button
            type="button"
            onClick={onPrevious}
            variant="outline"
            disabled={currentStep === 0}
            className="flex items-center"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            type="button"
            onClick={onNext}
            className="flex items-center bg-[#DC143C] hover:bg-[#DC143C]/90"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
