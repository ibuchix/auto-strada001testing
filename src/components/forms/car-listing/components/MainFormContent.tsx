
/**
 * Main Form Content component
 * - Extracted from FormContent.tsx to separate the main form rendering logic
 * - Updated 2025-04-02: Fixed form context usage to prevent undefined form errors
 * - Updated 2025-04-03: Fixed props passing to work with FormDataProvider
 * - Updated 2025-07-03: Fixed StepForm integration and removed Next.js references
 * - Updated 2025-07-18: Fixed FormStep type compatibility with StepForm
 */
import { memo } from "react";
import { StepForm } from "../StepForm";
import { useFormData } from "../context/FormDataContext";
import { formSteps } from "../constants/formSteps";
import { FormStep } from "../types";

interface MainFormContentProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  carId?: string;
  lastSaved: Date | null;
  isOffline: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  saveProgress: () => Promise<boolean>;
  visibleSections: string[];
  totalSteps: number;
  onSaveAndContinue: () => Promise<void>;
  onSave: () => Promise<void>;
}

export const MainFormContent = memo(({
  currentStep,
  setCurrentStep,
  carId,
  lastSaved,
  isOffline,
  isSaving,
  isSubmitting,
  saveProgress,
  visibleSections,
  onSaveAndContinue,
  onSave
}: MainFormContentProps) => {
  // Get form from context
  const { form } = useFormData();
  
  // Convert formSteps to match FormStep type
  const convertedSteps: FormStep[] = formSteps.map(step => ({
    ...step,
    component: step.component || null  // Add component property if missing
  }));
  
  return (
    <div className="relative">
      {/* Conditionally show submitting overlay if needed */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center p-4">
            <div className="mb-2 animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p>Submitting your listing...</p>
          </div>
        </div>
      )}
      
      <StepForm 
        form={form}
        steps={convertedSteps}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        carId={carId}
        lastSaved={lastSaved}
        isOffline={isOffline}
        saveProgress={saveProgress}
        visibleSections={visibleSections}
        isSaving={isSaving}
        onComplete={() => onSaveAndContinue()}
      />
    </div>
  );
});

MainFormContent.displayName = 'MainFormContent';
