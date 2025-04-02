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
import { getFormDefaults } from "./hooks/useFormDefaults";

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

  const completionPercentage = useMemo(() => {
    const defaultValues = getFormDefaults();
    const completedStepsCount = Object.values(completedSteps).filter(Boolean).length;
    const basicProgress = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;
    
    const formValues = form.getValues();
    let totalFields = 0;
    let completedFields = 0;
    
    for (let i = 0; i <= currentStep; i++) {
      if (i >= filteredSteps.length) continue;
      
      const fieldsInStep = STEP_FIELD_MAPPINGS[filteredSteps[i].id] || [];
      
      fieldsInStep.forEach(field => {
        const fieldValue = formValues[field as keyof CarListingFormData];
        const defaultValue = defaultValues[field as keyof typeof defaultValues];
        
        totalFields++;
        
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          if (Array.isArray(fieldValue)) {
            if (fieldValue.length > 0) completedFields++;
          } 
          else if (typeof fieldValue === 'object') {
            if (typeof defaultValue === 'object' && defaultValue !== null) {
              const hasModifiedProps = Object.entries(fieldValue).some(([key, val]) => {
                const defVal = defaultValue[key as keyof typeof defaultValue];
                return val !== defVal && val !== false;
              });
              if (hasModifiedProps) completedFields++;
            } else if (Object.values(fieldValue).some(v => Boolean(v))) {
              completedFields++;
            }
          } 
          else if (fieldValue !== defaultValue) {
            if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
            } else {
              completedFields++;
            }
          }
        }
      });
    }
    
    const fieldProgress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    const stepRatio = Math.min(currentStep / (totalSteps - 1), 1);
    const combinedProgress = Math.round(fieldProgress * (1 - stepRatio * 0.5) + basicProgress * (stepRatio * 0.5));
    
    return Math.max(combinedProgress, currentStep > 0 ? 10 : 5);
  }, [form, filteredSteps, currentStep, completedSteps, totalSteps]);

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
          validationErrors={stepValidationErrors}
        />
      </div>
      
      {filteredSteps[currentStep]?.description && (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800">
            {filteredSteps[currentStep].description}
          </h3>
        </div>
      )}
      
      <ValidationErrorDisplay validationErrors={validationErrors} />
      
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
