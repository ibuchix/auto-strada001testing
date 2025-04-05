
/**
 * Changes made:
 * - 2025-04-09: Major refactoring - extracted most logic into specialized hooks
 * - 2025-04-09: Simplified component to focus on composition and layout
 * - 2025-04-09: Reduced file size by ~70% through better separation of concerns
 * - 2025-04-09: Fixed potential infinite re-render issues
 * - 2025-04-09: Improved error boundaries and recovery mechanisms
 */

import { useCallback, memo } from "react";
import { Session } from "@supabase/supabase-js";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { useFormDialogs } from "./hooks/useFormDialogs";
import { FormContentLayout } from "./FormContentLayout";
import { FormDataProvider } from "./context/FormDataContext";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { FormErrorProvider } from "./context/FormErrorContext";
import { FormContentRenderer } from "./components/FormContentRenderer";
import { useFormController } from "./hooks/useFormController";
import { useFormStepsController } from "./hooks/useFormStepsController";
import { useFormActionHandlers } from "./hooks/useFormActionHandlers";
import { useVehicleDataManager } from "./hooks/vehicle-details/useVehicleDataManager";

interface FormContentProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
}

export const FormContent = memo(({ 
  session, 
  draftId,
  onDraftError,
  retryCount = 0
}: FormContentProps) => {
  // Form controller - handles form state, initialization and submission
  const { 
    form,
    formState,
    isLoadingDraft,
    draftError,
    isSubmitting,
    persistence,
    actions
  } = useFormController({
    session,
    draftId,
    onDraftError,
    retryCount
  });
  
  // Vehicle data management - centralized
  const vehicleDataManager = useVehicleDataManager(form);
  
  // Section visibility management
  const { visibleSections } = useSectionsVisibility(form, formState.carId);
  
  // Step management and progress tracking
  const {
    currentStep,
    progress,
    stepErrors,
    completedStepsArray,
    validationErrors,
    handleStepChange,
    filteredSteps
  } = useFormStepsController({
    form,
    visibleSections,
    currentStep: formState.currentStep,
    totalSteps: formState.totalSteps,
    saveProgress: actions.saveProgress,
    updateFormState: actions.updateFormState
  });

  // Dialog management
  const { showSaveDialog, showSuccessDialog, actions: dialogActions } = useFormDialogs();

  // Form action handlers
  const formActionConfig = {
    handleSubmit: actions.handleSubmit,
    saveProgress: actions.saveProgress,
    showSaveDialog: dialogActions.showSaveDialog,
    showSuccessDialog: dialogActions.showSuccessDialog
  };
  
  const { onSubmit, handleSaveAndContinue, handleSave } = useFormActionHandlers(formActionConfig);

  // Create error handler for critical sections
  const handleComponentError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Component error caught by boundary:', error);
    
    if (onDraftError && error.message.includes('draft')) {
      onDraftError(error);
    } else if (actions.handleFormError) {
      actions.handleFormError(error);
    } else {
      console.error('Unhandled form error:', error, errorInfo);
    }
  }, [onDraftError, actions.handleFormError]);

  // Main form content - wrap in FormDataProvider and ErrorBoundary for better context sharing
  return (
    <ErrorBoundary 
      onError={handleComponentError}
      boundary="form-content-outer"
      resetOnPropsChange
    >
      <FormErrorProvider formId={formState.carId || 'new-form'}>
        <FormDataProvider form={form}>
          <FormContentLayout
            form={form}
            isInitializing={formState.isInitializing}
            isLoadingDraft={isLoadingDraft}
            draftError={draftError}
            onDraftErrorRetry={actions.resetDraftError}
            onFormSubmit={(data) => onSubmit(data, formState.carId)}
            onFormError={handleComponentError}
            layoutId={formState.carId || 'new-form'}
          >
            {!formState.isInitializing && !isLoadingDraft && (
              <FormContentRenderer
                currentStep={currentStep}
                setCurrentStep={handleStepChange}
                lastSaved={formState.lastSaved}
                carId={formState.carId}
                isOffline={persistence.isOffline}
                isSaving={persistence.isSaving}
                isSubmitting={isSubmitting}
                saveProgress={actions.saveProgress}
                visibleSections={visibleSections}
                stepErrors={stepErrors}
                validationErrors={validationErrors}
                completedSteps={completedStepsArray}
                totalSteps={formState.totalSteps}
                progress={progress}
                showSuccessDialog={showSuccessDialog}
                showSaveDialog={showSaveDialog}
                onSuccessDialogOpenChange={(open) => !open && dialogActions.hideSuccessDialog()}
                onSaveDialogOpenChange={(open) => !open && dialogActions.hideSaveDialog()}
                onSaveAndContinue={handleSaveAndContinue}
                onSave={handleSave}
                onFormError={handleComponentError}
              />
            )}
          </FormContentLayout>
        </FormDataProvider>
      </FormErrorProvider>
    </ErrorBoundary>
  );
});

// Add display name for better debugging
FormContent.displayName = 'FormContent';
