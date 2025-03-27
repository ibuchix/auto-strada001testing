
/**
 * Changes made:
 * - Removed explicit SaveButton
 * - Integrated automatic saving during navigation
 * - Simplified footer layout
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { Button } from "@/components/ui/button";
import { FormStepper } from "./FormStepper";
import { FormFooter } from "./FormFooter";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => void;
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
  visibleSections,
  isSaving = false
}: StepFormProps) => {
  const totalSteps = formSteps.length;
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      saveProgress(); // Save progress when moving back
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      saveProgress(); // Automatically save progress before moving to next step
      setCurrentStep(currentStep + 1);
    }
  };
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <div className="mb-10">
        <FormStepper 
          steps={formSteps} 
          currentStep={currentStep} 
          onStepChange={setCurrentStep}
          visibleSections={visibleSections}
        />
      </div>
      
      <div className="form-container min-h-[400px] mb-10">
        <FormSections 
          form={form} 
          currentStep={currentStep}
          carId={carId}
          userId={form.watch("seller_id") as string}
        />
      </div>
      
      <div className="flex justify-between items-center mt-12 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0 || isSaving}
          className="w-32 h-11 text-base"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        
        {currentStep < totalSteps - 1 ? (
          <Button
            type="button"
            onClick={handleNext}
            disabled={isSaving}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-32 h-11 text-base"
          >
            Submit
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
