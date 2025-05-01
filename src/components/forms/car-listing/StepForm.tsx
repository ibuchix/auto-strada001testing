
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { useMemo, useState, useCallback } from "react";
import { ValidationErrorDisplay } from "./ValidationErrorDisplay";
import { FormNavigationControls } from "./FormNavigationControls";
import { FormFooter } from "./FormFooter";
import { FormContainer } from "./components/FormContainer";
import { useCompletionPercentage } from "./hooks/useCompletionPercentage";
import { FormErrorSection } from "./components/FormErrorSection";
import { FormDataProvider } from "./context/FormDataContext";

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
  // Safeguard against undefined form
  if (!form) {
    console.error("Form is undefined in StepForm component");
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
        <p className="text-red-500">Error: Form context not available</p>
        <p>Please refresh the page and try again</p>
      </div>
    );
  }

  // Filter steps based on visible sections
  const filteredSteps = useMemo(() => {
    return formSteps.filter(step => {
      return step.sections.some(section => visibleSections.includes(section));
    });
  }, [visibleSections]);
  
  const totalSteps = filteredSteps.length;
  
  // Step navigation state
  const [currentStep, setCurrentStepInternal] = useState(initialStep);
  const [isNavigating, setIsNavigating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<number, string[]>>({});
  const [navigationDisabled, setNavigationDisabled] = useState(false);
  
  // Handle step change and synchronize with external state
  const handleStepChange = useCallback((step: number) => {
    setCurrentStepInternal(step);
    externalSetCurrentStep(step);
  }, [externalSetCurrentStep]);
  
  // Handle previous navigation
  const handlePrevious = useCallback(async () => {
    if (currentStep > 0) {
      setIsNavigating(true);
      try {
        await saveProgress();
        handleStepChange(currentStep - 1);
      } catch (error) {
        console.error("Error navigating to previous step:", error);
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentStep, saveProgress, handleStepChange]);
  
  // Handle next navigation with validation
  const handleNext = useCallback(async () => {
    if (currentStep < totalSteps - 1) {
      setIsNavigating(true);
      setNavigationDisabled(true);
      
      try {
        // Validate current step
        const currentStepConfig = filteredSteps[currentStep];
        let isValid = true;
        
        // Custom validation if available
        if (currentStepConfig?.validate) {
          isValid = currentStepConfig.validate(form.getValues());
        }
        
        // Form validation
        if (isValid) {
          // Save and navigate
          await saveProgress();
          handleStepChange(currentStep + 1);
        } else {
          setStepValidationErrors(prev => ({
            ...prev,
            [currentStep]: ["Please correct the errors before continuing"]
          }));
        }
      } catch (error) {
        console.error("Error navigating to next step:", error);
      } finally {
        setIsNavigating(false);
        setNavigationDisabled(false);
      }
    }
  }, [currentStep, totalSteps, filteredSteps, form, saveProgress, handleStepChange]);

  // Calculate completion percentage
  const completionPercentage = useCompletionPercentage({
    form,
    currentStep,
    completedSteps,
    totalSteps,
    filteredSteps
  });

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
      
      {/* Wrap the content with FormDataProvider to provide form context to all children */}
      <FormDataProvider form={form}>
        <FormContainer 
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
      </FormDataProvider>
      
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
