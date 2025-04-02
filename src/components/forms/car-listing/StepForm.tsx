
/**
 * Changes made:
 * - Refactored to reduce component complexity and improve maintainability
 * - Extracted navigation logic into a custom hook
 * - Created separate components for validation errors and navigation controls
 * - Improved type safety and reduced redundancy
 * - Enhanced error handling with clearer user feedback
 * - Better organization of code with logical grouping
 * - Added save and continue later functionality
 * - Added completion percentage calculation for progress indicator
 * - Added gesture-based navigation for mobile devices
 * - 2027-11-19: Fixed TypeScript compatibility issues with useStepNavigation
 * - 2027-11-20: Fixed type errors with validationErrors and Promise return types
 * - 2027-11-21: Updated function return types and fixed validation errors type
 */

import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { FormSections } from "./FormSections";
import { FormStepper } from "./FormStepper";
import { FormFooter } from "./FormFooter";
import { ValidationErrorDisplay } from "./ValidationErrorDisplay";
import { FormNavigationControls } from "./FormNavigationControls";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useMemo } from "react";
import { STEP_FIELD_MAPPINGS } from "./hooks/useStepNavigation";
import { SwipeNavigation } from "./SwipeNavigation";

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
    const formValues = form.getValues();
    let totalFields = 0;
    let completedFields = 0;
    
    // Count fields from all visible steps
    filteredSteps.forEach(step => {
      const fieldsInStep = STEP_FIELD_MAPPINGS[step.id] || [];
      
      fieldsInStep.forEach(field => {
        const fieldValue = formValues[field as keyof CarListingFormData];
        totalFields++;
        
        // Check if the field has a value
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          if (typeof fieldValue === 'object') {
            // For objects like features, check if any property is true
            if (Array.isArray(fieldValue)) {
              if (fieldValue.length > 0) completedFields++;
            } else if (Object.values(fieldValue).some(v => v)) {
              completedFields++;
            }
          } else {
            completedFields++;
          }
        }
      });
    });
    
    return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
  }, [form, filteredSteps]);

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
      <div className="mb-6">
        <FormStepper 
          steps={filteredSteps} 
          currentStep={currentStep} 
          onStepChange={handleStepChange}
          visibleSections={visibleSections}
          completedSteps={completedStepsArray}
          validationErrors={stepValidationErrors as Record<string, boolean>}
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
      
      {/* Progress indicator */}
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
