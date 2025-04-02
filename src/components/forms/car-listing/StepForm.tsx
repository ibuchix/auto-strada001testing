
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { FormStepper } from "./FormStepper";
import { SwipeNavigation } from "./SwipeNavigation";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useMemo } from "react";
import { STEP_FIELD_MAPPINGS } from "./hooks/useStepValidation";
import { ValidationErrorDisplay } from "./ValidationErrorDisplay";
import { FormNavigationControls } from "./FormNavigationControls";
import { FormFooter } from "./FormFooter";

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
  // Filter steps based on visibility of their sections
  const filteredSteps = formSteps.filter(step => {
    return step.sections.some(section => visibleSections.includes(section));
  });
  
  const totalSteps = filteredSteps.length;
  
  // Use the step navigation hook with type-safe wrappers
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

  // Calculate overall form completion percentage
  const completionPercentage = useMemo(() => {
    // For initial rendering, just show progress based on completed steps
    const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
    const basicProgress = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;
    
    // Don't count fields that just have default values
    const formValues = form.getValues();
    let totalFields = 0;
    let completedFields = 0;
    
    // Only count fields from the current and previous steps
    for (let i = 0; i <= currentStep; i++) {
      if (i >= filteredSteps.length) continue;
      
      const fieldsInStep = STEP_FIELD_MAPPINGS[filteredSteps[i].id] || [];
      
      fieldsInStep.forEach(field => {
        const fieldValue = formValues[field as keyof CarListingFormData];
        totalFields++;
        
        // Only count a field as completed if it has been explicitly set or modified
        // This prevents counting default values as completed
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          // For arrays, check if they have been modified from default empty state
          if (Array.isArray(fieldValue)) {
            if (fieldValue.length > 0) completedFields++;
          } 
          // For objects, check if they have properties that are true
          else if (typeof fieldValue === 'object') {
            if (Object.values(fieldValue).some(v => v === true)) {
              completedFields++;
            }
          } 
          // For primitive values, check if they're truthy or numeric values (including 0)
          else if (fieldValue || typeof fieldValue === 'number') {
            completedFields++;
          }
        }
      });
    }
    
    // Calculate more accurate percentage based on fields
    const fieldProgress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    // Combine both metrics, giving more weight to field progress for early steps
    // and more weight to step completion for later steps
    const stepRatio = currentStep / totalSteps;
    const combinedProgress = Math.round(fieldProgress * (1 - stepRatio) + basicProgress * stepRatio);
    
    // Ensure progress is never more than actual step completion percentage
    return Math.min(combinedProgress, basicProgress > 0 ? basicProgress : 10);
  }, [form, filteredSteps, currentStep, completedSteps, totalSteps]);

  // Sync external state with internal state
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    externalSetCurrentStep(step);
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  
  // Convert completedSteps from Record to array for compatibility
  const completedStepsArray = useMemo(() => {
    return Object.entries(completedSteps).reduce((acc, [step, isCompleted]) => {
      if (isCompleted) {
        acc.push(parseInt(step, 10));
      }
      return acc;
    }, [] as number[]);
  }, [completedSteps]);
  
  // Create wrapper functions to ensure proper return types
  const handlePreviousWrapper = async (): Promise<void> => {
    await handlePrevious();
  };
  
  const handleNextWrapper = async (): Promise<void> => {
    await handleNext();
  };
  
  const saveProgressWrapper = async (): Promise<void> => {
    await saveProgress();
  };
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
      {/* Stepper is now the ONLY step indicator */}
      <div className="mb-6">
        <FormStepper 
          steps={filteredSteps} 
          currentStep={currentStep} 
          onStepChange={handleStepChange}
          visibleSections={visibleSections}
          completedSteps={completedStepsArray}
          validationErrors={stepValidationErrors}
        />
      </div>
      
      {/* Current step description */}
      {filteredSteps[currentStep]?.description && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800">
            {filteredSteps[currentStep].description}
          </h3>
        </div>
      )}
      
      {/* Validation errors display */}
      <ValidationErrorDisplay validationErrors={validationErrors} />
      
      {/* Form content with swipe navigation */}
      <div className="form-container min-h-[400px] mb-10">
        <SwipeNavigation
          onNext={handleNextWrapper}
          onPrevious={handlePreviousWrapper}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          disabled={navigationDisabled || isSaving}
        >
          <FormSections 
            form={form} 
            currentStep={currentStep}
            carId={carId}
            userId={form.watch("seller_id") as string}
          />
        </SwipeNavigation>
      </div>
      
      {/* Navigation controls with save and continue functionality */}
      <FormNavigationControls
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={handlePreviousWrapper}
        onNext={handleNextWrapper}
        isNavigating={navigationDisabled || isSaving}
        onSave={saveProgressWrapper}
        carId={carId}
      />
      
      {/* Progress footer */}
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
