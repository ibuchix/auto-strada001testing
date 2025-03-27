
/**
 * Changes made:
 * - Added saving indicator in the UI
 * - Improved step navigation to avoid blocking on save operations
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { Button } from "@/components/ui/button";
import { FormStepper } from "./FormStepper";
import { FormFooter } from "./FormFooter";
import { Loader2 } from "lucide-react";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => void;
  formErrors: any;
  visibleSections: string[];
  isSaving?: boolean;
}

export const StepForm = ({
  form,
  currentStep,
  setCurrentStep,
  carId,
  lastSaved,
  isOffline,
  saveProgress,
  formErrors,
  visibleSections,
  isSaving = false
}: StepFormProps) => {
  const totalSteps = formSteps.length;
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  return (
    <div className="space-y-10">
      <div className="mb-8">
        <FormStepper 
          steps={formSteps} 
          currentStep={currentStep} 
          onStepChange={setCurrentStep}
          visibleSections={visibleSections}
        />
      </div>
      
      <div className="form-container min-h-[400px]">
        <FormSections 
          form={form} 
          currentStep={currentStep}
          carId={carId}
          userId={form.watch("seller_id") as string}
        />
      </div>
      
      <div className="flex justify-between items-center mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSaving}
          className="w-28"
        >
          Previous
        </Button>
        
        <div className="flex-grow text-center">
          {isSaving && (
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </div>
          )}
        </div>
        
        {currentStep < totalSteps - 1 && (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSaving}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-28"
          >
            Next
          </Button>
        )}
      </div>
      
      <FormFooter
        lastSaved={lastSaved}
        isOffline={isOffline}
        onSave={saveProgress}
        isSaving={isSaving}
      />
    </div>
  );
};
