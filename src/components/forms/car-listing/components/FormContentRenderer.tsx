
/**
 * A dedicated component to render the form content with proper error boundaries
 * 
 * Changes made:
 * - 2025-04-07: Extracted from FormContent.tsx to separate rendering logic
 * - 2025-04-07: Added proper error handling and fallbacks 
 * - 2025-04-07: Improved performance with memoization
 */
import { memo } from "react";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { Alert, AlertCircle, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FormProgressSection } from "./FormProgressSection";
import { FormErrorSection } from "./FormErrorSection";
import { MainFormContent } from "./MainFormContent";
import { FormDialogs } from "./FormDialogs";

interface FormContentRendererProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  lastSaved: Date | null;
  carId?: string;
  isOffline: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  saveProgress: () => Promise<boolean>;
  visibleSections: string[];
  stepErrors: Record<string, boolean>;
  validationErrors: Record<number, string[]>;
  completedSteps: number[];
  totalSteps: number;
  progress: number;
  showSuccessDialog: boolean;
  showSaveDialog: boolean;
  onSuccessDialogOpenChange: (open: boolean) => void;
  onSaveDialogOpenChange: (open: boolean) => void;
  onSaveAndContinue: () => Promise<void>;
  onSave: () => Promise<void>;
  onFormError: (error: Error) => void;
}

export const FormContentRenderer = memo(({
  currentStep,
  setCurrentStep,
  lastSaved,
  carId,
  isOffline,
  isSaving,
  isSubmitting,
  saveProgress,
  visibleSections,
  stepErrors,
  validationErrors,
  completedSteps,
  totalSteps,
  progress,
  showSuccessDialog,
  showSaveDialog,
  onSuccessDialogOpenChange,
  onSaveDialogOpenChange,
  onSaveAndContinue,
  onSave,
  onFormError
}: FormContentRendererProps) => {
  const handleComponentError = (error: Error) => {
    console.error("Form renderer error:", error);
    onFormError(error);
  };
  
  return (
    <>
      <FormProgressSection
        currentStep={currentStep}
        lastSaved={lastSaved}
        onOfflineStatusChange={(status) => console.log("Offline status:", status)}
        steps={[]} // This will be filled by the component
        visibleSections={visibleSections}
        completedSteps={completedSteps}
        validationErrors={stepErrors}
        onStepChange={setCurrentStep}
        progress={progress}
      />
      
      <FormErrorSection 
        validationErrors={validationErrors}
        showDetails={process.env.NODE_ENV !== 'production'}
      />
      
      <ErrorBoundary
        boundary="main-form-content"
        resetOnPropsChange
        onError={handleComponentError}
        fallback={
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                There was an error loading the form content. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          </div>
        }
      >
        <MainFormContent
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          carId={carId}
          lastSaved={lastSaved}
          isOffline={isOffline}
          isSaving={isSaving}
          isSubmitting={isSubmitting}
          saveProgress={saveProgress}
          visibleSections={visibleSections}
          totalSteps={totalSteps}
          onSaveAndContinue={onSaveAndContinue}
          onSave={onSave}
        />
      </ErrorBoundary>

      <FormDialogs 
        showSuccessDialog={showSuccessDialog}
        showSaveDialog={showSaveDialog}
        onSuccessDialogOpenChange={onSuccessDialogOpenChange}
        onSaveDialogOpenChange={onSaveDialogOpenChange}
        lastSaved={lastSaved}
        carId={carId}
      />
    </>
  );
});

FormContentRenderer.displayName = 'FormContentRenderer';
