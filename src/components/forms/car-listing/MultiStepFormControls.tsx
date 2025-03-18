
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, SendIcon, WifiOff } from "lucide-react";

interface MultiStepFormControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
  onSubmit: () => void;
  isOffline?: boolean;
}

export const MultiStepFormControls = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isSubmitting,
  isLastStep,
  onSubmit,
  isOffline = false
}: MultiStepFormControlsProps) => {
  return (
    <div className="flex justify-between items-center mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0 || isSubmitting}
        className="flex items-center gap-2"
      >
        <ChevronLeft size={16} />
        Previous
      </Button>

      <div className="text-sm text-gray-500">
        Step {currentStep + 1} of {totalSteps}
      </div>

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isOffline}
          className="flex items-center gap-2 bg-primary"
        >
          {isSubmitting ? "Submitting..." : "Submit Listing"}
          {isOffline ? <WifiOff size={16} /> : <SendIcon size={16} />}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      )}
    </div>
  );
};
