
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useMemo } from "react";
import { ValidationErrorDisplay } from "./ValidationErrorDisplay";
import { FormNavigationControls } from "./FormNavigationControls";
import { FormFooter } from "./FormFooter";
import { FormProgressIndicator } from "./components/FormProgressIndicator";
import { FormContainer } from "./components/FormContainer";
import { useCompletionPercentage } from "./hooks/useCompletionPercentage";

interface StepFormProps {
  form: UseFormReturn<CarListingFormData>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  saveProgress: () => Promise<boolean>;
  visibleSections: string[];
  isSaving?: boolean;
}

export const StepForm = ({
  form,
  currentStep: initialStep,
  setCurrentStep: externalSetCurrentStep,
  carId,
  lastSaved,
  isOffline,
  saveProgress,
  visibleSections,
  isSaving = false
}: StepFormProps) => {
  const filteredSteps = formSteps.filter(step => {
    return step.sections.some(section => visibleSections.includes(section));
  });
  
  const totalSteps = filteredSteps.length;
  
  const {
    currentStep,
    isNavigating,
    validationErrors,
    completedSteps,
    stepValidationErrors,
    handlePrevious,
    handleNext,
    setCurrentStep,
    navigationDisabled
  } = useStepNavigation({
    form,
    totalSteps,
    initialStep,
    saveProgress: async () => {
      await saveProgress();
      return true;
    },
    filteredSteps: filteredSteps.map(step => ({
      id: step.id,
      validate: step.validate ? () => step.validate?.(form.getValues()) ?? true : undefined
    }))
  });

  const completionPercentage = useCompletionPercentage({
    form,
    currentStep,
    completedSteps,
    totalSteps,
    filteredSteps
  });

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    externalSetCurrentStep(step);
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  const completedStepsArray = useMemo(() => {
    return Object.entries(completedSteps).reduce((acc, [step, isCompleted]) => {
      if (isCompleted) {
        acc.push(parseInt(step, 10));
      }
      return acc;
    }, [] as number[]);
  }, [completedSteps]);
  
  // Enhanced wrapper functions to ensure proper async handling and debugging
  const handlePreviousWrapper = async (): Promise<void> => {
    console.log("Previous button clicked in StepForm");
    try {
      await handlePrevious();
    } catch (error) {
      console.error("Error in handlePreviousWrapper:", error);
    }
  };
  
  const handleNextWrapper = async (): Promise<void> => {
    console.log("Next button clicked in StepForm");
    try {
      await handleNext();
    } catch (error) {
      console.error("Error in handleNextWrapper:", error);
    }
  };
  
  const saveProgressWrapper = async (): Promise<void> => {
    console.log("Save button clicked in StepForm");
    try {
      await saveProgress();
    } catch (error) {
      console.error("Error in saveProgressWrapper:", error);
    }
  };
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <FormProgressIndicator
        steps={filteredSteps}
        currentStep={currentStep}
        onStepChange={handleStepChange}
        visibleSections={visibleSections}
        completedSteps={completedStepsArray}
        validationErrors={stepValidationErrors}
        description={filteredSteps[currentStep]?.description}
      />
      
      <ValidationErrorDisplay validationErrors={validationErrors} />
      
      <FormContainer 
        form={form}
        currentStep={currentStep}
        onNext={handleNextWrapper}
        onPrevious={handlePreviousWrapper}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        navigationDisabled={navigationDisabled}
        isSaving={isSaving}
        carId={carId}
        userId={form.watch("seller_id") as string}
      />
      
      <FormNavigationControls
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={handlePreviousWrapper}
        onNext={handleNextWrapper}
        isNavigating={navigationDisabled || isSaving}
        onSave={saveProgressWrapper}
        carId={carId}
      />
      
      <FormFooter
        lastSaved={lastSaved}
        isOffline={isOffline}
        onSave={saveProgressWrapper}
        isSaving={navigationDisabled || isSaving}
        currentStep={currentStep + 1}
        totalSteps={totalSteps}
        completionPercentage={completionPercentage}
      />
    </div>
  );
};
