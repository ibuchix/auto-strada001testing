
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useMemo } from "react";
import { ValidationErrorDisplay } from "./ValidationErrorDisplay";
import { FormNavigationControls } from "./FormNavigationControls";
import { FormFooter } from "./FormFooter";
import { FormContainer } from "./components/FormContainer";
import { useCompletionPercentage } from "./hooks/useCompletionPercentage";
import { FormErrorSection } from "./components/FormErrorSection";

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
  // Filter steps based on visible sections
  const filteredSteps = useMemo(() => {
    return formSteps.filter(step => {
      return step.sections.some(section => visibleSections.includes(section));
    });
  }, [visibleSections]);
  
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

  // Calculate completion percentage
  const completionPercentage = useCompletionPercentage({
    form,
    currentStep,
    completedSteps,
    totalSteps,
    filteredSteps
  });

  // Handle step change and synchronize with external state
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    externalSetCurrentStep(step);
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  // Calculate completed steps array for progress display
  const completedStepsArray = useMemo(() => {
    return Object.entries(completedSteps).reduce((acc, [step, isCompleted]) => {
      if (isCompleted) {
        acc.push(parseInt(step, 10));
      }
      return acc;
    }, [] as number[]);
  }, [completedSteps]);
  
  // Convert stepValidationErrors (Record<number, string[]>) to the format expected by FormProgressIndicator
  const formattedValidationErrors = useMemo(() => {
    const formatted: Record<string, boolean> = {};
    
    // Convert numeric keys to strings and map arrays to booleans (has errors or not)
    Object.entries(stepValidationErrors).forEach(([stepIndex, errors]) => {
      formatted[stepIndex] = Array.isArray(errors) && errors.length > 0;
    });
    
    return formatted;
  }, [stepValidationErrors]);
  
  // Enhanced wrapper functions for button handling
  const handlePreviousWrapper = async () => {
    try {
      await handlePrevious();
    } catch (error) {
      console.error("Error in handlePreviousWrapper:", error);
    }
  };
  
  const handleNextWrapper = async () => {
    try {
      await handleNext();
    } catch (error) {
      console.error("Error in handleNextWrapper:", error);
    }
  };
  
  const saveProgressWrapper = async () => {
    try {
      await saveProgress();
    } catch (error) {
      console.error("Error in saveProgressWrapper:", error);
    }
  };
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
      {/* We've removed FormProgressIndicator from here since it's now managed by FormContent */}
      
      {/* Display validation errors */}
      <FormErrorSection validationErrors={stepValidationErrors} />
      
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
      />
    </div>
  );
};
