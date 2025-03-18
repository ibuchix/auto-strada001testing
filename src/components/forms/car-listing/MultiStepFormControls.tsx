
/**
 * Changes made:
 * - 2024-08-08: Created MultiStepFormControls component for multi-step form navigation
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";

interface MultiStepFormControlsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
  onSubmit: () => void;
}

export const MultiStepFormControls = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isSubmitting,
  isLastStep,
  onSubmit
}: MultiStepFormControlsProps) => {
  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-900 p-4 shadow-lg rounded-t-lg border-t z-50 flex justify-between">
      {currentStep > 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
      ) : (
        <div></div>
      )}

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          className={`bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-semibold py-3 px-6 text-lg rounded-md transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Submitting...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>Submit Listing</span>
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          className="bg-secondary hover:bg-secondary/90 text-white flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
