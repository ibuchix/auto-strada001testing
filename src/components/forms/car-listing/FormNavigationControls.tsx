
/**
 * FormNavigationControls Component
 * Created: 2025-06-16
 * Updated: 2025-06-17 - Added FormSubmitHandler for last step
 * 
 * Navigation controls for the multi-step form
 */

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { FormSubmitHandler } from "./submission/FormSubmitHandler";

interface FormNavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  navigationDisabled: boolean;
  isSaving: boolean;
  isNavigating: boolean;
  onSave: () => Promise<boolean>;
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
  isNavigating,
  onSave,
  carId,
}: FormNavigationControlsProps) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between gap-4 pt-4 border-t">
      <div>
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
          disabled={isFirstStep || navigationDisabled}
          className={isFirstStep ? "invisible" : ""}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
      </div>
      
      <div className="flex gap-2 flex-col sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Progress
        </Button>
        
        {isLastStep ? (
          <FormSubmitHandler carId={carId} />
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={navigationDisabled || isNavigating}
          >
            {isNavigating ? (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
            ) : null}
            
            Next
            
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
