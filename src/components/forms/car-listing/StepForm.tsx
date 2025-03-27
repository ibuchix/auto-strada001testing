
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { FormSections } from "./FormSections";
import { MultiStepFormControls } from "./MultiStepFormControls";
import { LastSaved } from "./LastSaved";
import { FormProgress } from "./FormProgress";
import { formSteps } from "./constants/formSteps";
import { FieldErrors } from "react-hook-form";
import { useState } from "react";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => Promise<void>;
  formErrors: FieldErrors<CarListingFormData>;
  visibleSections: string[];
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
  visibleSections
}: StepFormProps) => {
  const [isSaving, setIsSaving] = useState(false);

  // Calculate the current percentage of completion
  const progress = Math.min(
    Math.round(((currentStep + 1) / formSteps.length) * 100),
    100
  );

  // Determine if this is the last step
  const isLastStep = currentStep === formSteps.length - 1;

  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Save progress in the background after navigation
      setIsSaving(true);
      saveProgress().finally(() => {
        setIsSaving(false);
      });
    }
  };

  // Navigate to next step
  const handleNext = async () => {
    if (currentStep < formSteps.length - 1) {
      // First change the step immediately for better UX
      setCurrentStep(currentStep + 1);
      
      // Then save in the background with visual feedback
      setIsSaving(true);
      saveProgress().finally(() => {
        setIsSaving(false);
      });
    }
  };

  // Handle form submission (on last step)
  const handleSubmit = () => {
    form.handleSubmit(() => {})();
  };

  // Get user ID from session, not from form data
  const userId = form.getValues().name ? form.getValues().name : "";

  return (
    <div className="space-y-8">
      {/* Centralized progress indicator */}
      <FormProgress 
        progress={progress} 
        steps={formSteps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
      />
      
      {/* Last saved indicator */}
      <div className="flex justify-between items-center">
        <LastSaved timestamp={lastSaved} />
        {isOffline && (
          <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
            Offline Mode
          </span>
        )}
        {isSaving && (
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-md animate-pulse">
            Saving your progress...
          </span>
        )}
      </div>
      
      {/* Current step content */}
      <FormSections 
        form={form} 
        currentStep={currentStep} 
        carId={carId}
        userId={userId}
      />
      
      {/* Navigation controls */}
      <MultiStepFormControls
        currentStep={currentStep}
        totalSteps={formSteps.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={false}
        isLastStep={isLastStep}
        isSaving={isSaving}
      />
    </div>
  );
};
