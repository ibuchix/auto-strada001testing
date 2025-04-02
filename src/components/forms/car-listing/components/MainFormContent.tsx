
/**
 * Main Form Content component
 * - Extracted from FormContent.tsx to separate the main form rendering logic
 * - Updated 2025-04-02: Fixed form context usage to prevent undefined form errors
 */
import { memo } from "react";
import { StepForm } from "../StepForm";
import { FormNavigationControls } from "../FormNavigationControls";
import { FormFooter } from "../FormFooter";
import { useFormData } from "../context/FormDataContext";

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
  totalSteps,
  onSaveAndContinue,
  onSave
}: MainFormContentProps) => {
  // Get form from context instead of expecting it as a prop
  const { form } = useFormData();
  
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
        form={form} // Pass form from context
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        carId={carId}
        lastSaved={lastSaved}
        isOffline={isOffline}
        saveProgress={saveProgress}
        visibleSections={visibleSections}
        isSaving={isSaving}
      />
    </div>
  );
});

MainFormContent.displayName = 'MainFormContent';
