
/**
 * Form Navigation Controls
 * Created: 2025-05-03
 * 
 * Navigation controls for the multi-step form
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

interface FormNavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  navigationDisabled: boolean;
  isSaving: boolean;
  isNavigating?: boolean;
  onSave: () => Promise<boolean | void>;
  carId?: string;
}

export const FormNavigationControls = ({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  navigationDisabled,
  isSaving,
  isNavigating = false,
  onSave,
  carId
}: FormNavigationControlsProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          disabled={isFirstStep || navigationDisabled || isNavigating}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
      
      <div className="text-center text-sm text-gray-500">
        Step {currentStep + 1} of {totalSteps}
      </div>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={isSaving || isNavigating}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Progress
        </Button>
        
        <Button
          type="button"
          onClick={onNext}
          disabled={navigationDisabled || isNavigating}
        >
          {isLastStep ? 'Submit' : 'Next'}
          {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
