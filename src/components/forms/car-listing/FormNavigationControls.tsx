
/**
 * Form Navigation Controls
 * Provides navigation buttons for a multi-step form
 */

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SaveAndContinueButton } from "./SaveAndContinueButton";

interface FormNavigationControlsProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isNavigating: boolean;
  onSave: () => Promise<void>;
  carId?: string;
}

export const FormNavigationControls = ({
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  isNavigating,
  onSave,
  carId
}: FormNavigationControlsProps) => {
  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isNavigating}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
        )}
      </div>
      
      <div className="flex space-x-3">
        <SaveAndContinueButton 
          onSave={onSave}
          carId={carId}
          isDisabled={isNavigating}
        />
        
        {!isLastStep ? (
          <Button
            type="button"
            onClick={onNext}
            disabled={isNavigating}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isNavigating}
            className="flex items-center gap-2"
          >
            Submit
          </Button>
        )}
      </div>
    </div>
  );
};
