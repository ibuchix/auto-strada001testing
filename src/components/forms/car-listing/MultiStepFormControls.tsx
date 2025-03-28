
/**
 * Changes made:
 * - Enhanced visual hierarchy with distinctive primary/secondary buttons
 * - Added clear visual indicators for button state
 * - Improved loading states with consistent styling
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";

interface MultiStepFormControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isLastStep: boolean;
  isSaving?: boolean;
}

export const MultiStepFormControls = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting,
  isLastStep,
  isSaving = false
}: MultiStepFormControlsProps) => {
  return (
    <div className="flex justify-between mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 0 || isSubmitting || isSaving}
        className="flex items-center border-gray-300 hover:bg-gray-50 hover:text-gray-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Previous
      </Button>

      {isLastStep ? (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white font-medium px-6"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit
              <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={isSubmitting || isSaving}
          className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white flex items-center px-6"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};
