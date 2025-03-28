
/**
 * Component for form navigation controls
 * - Handles previous/next buttons
 * - Submit button for the last step
 * - Responsive layout with proper button states
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface FormNavigationControlsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isNavigating: boolean;
}

export const FormNavigationControls = ({
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  isNavigating
}: FormNavigationControlsProps) => {
  return (
    <div className="flex justify-between items-center mt-12 border-t pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isNavigating}
        className="w-32 h-11 text-base"
        aria-label={isFirstStep ? "Cannot go back" : "Previous step"}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {isNavigating ? "Saving..." : "Previous"}
      </Button>
      
      {!isLastStep ? (
        <Button
          type="button"
          onClick={onNext}
          disabled={isNavigating}
          className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
          aria-label={isNavigating ? "Saving changes" : "Next step"}
        >
          {isNavigating ? "Saving..." : "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          type="submit"
          disabled={isNavigating}
          className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
          aria-label={isNavigating ? "Submitting..." : "Submit listing"}
        >
          Submit
        </Button>
      )}
    </div>
  );
};
