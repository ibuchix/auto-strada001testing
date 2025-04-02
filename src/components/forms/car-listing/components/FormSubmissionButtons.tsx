
/**
 * Changes made:
 * - 2024-06-10: Extracted form submission buttons from FormContent.tsx to create a reusable component
 * - Handles form submission and save actions
 * - 2024-06-18: Fixed TypeScript type errors with props
 */

import { Button } from "@/components/ui/button";
import { SaveButton } from "../SaveButton";
import { FormSubmitButton } from "../FormSubmitButton";
import { SaveAndContinueButton } from "../SaveAndContinueButton";
import { ArrowRight } from "lucide-react";

interface FormSubmissionButtonsProps {
  isLastStep: boolean;
  isSubmitting: boolean;
  isSaving: boolean;
  isOffline: boolean;
  onSaveAndContinue: () => Promise<void>;
  onSave: () => Promise<void>;
  currentStep: number;
}

export const FormSubmissionButtons = ({
  isLastStep,
  isSubmitting,
  isSaving,
  isOffline,
  onSaveAndContinue,
  onSave,
  currentStep,
}: FormSubmissionButtonsProps) => {
  return (
    <div className="mt-8 space-y-4">
      {isLastStep ? (
        <div className="flex justify-between gap-4 flex-col sm:flex-row">
          <div className="flex-1">
            <SaveButton 
              onClick={onSave} 
              isSaving={isSaving} 
              disabled={isOffline} 
            />
          </div>
          <div className="flex-1">
            <FormSubmitButton isSubmitting={isSubmitting}>
              Submit Listing
            </FormSubmitButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SaveButton 
              onClick={onSave} 
              isSaving={isSaving} 
              disabled={isOffline} 
            />
          </div>
          <div className="flex-1">
            <SaveAndContinueButton 
              onClick={onSaveAndContinue} 
              isSaving={isSaving} 
              disabled={isOffline}
              currentStep={currentStep}
            />
          </div>
        </div>
      )}
    </div>
  );
};
