
/**
 * Changes made:
 * - 2027-11-17: Fixed React hooks inconsistency by ensuring unconditional hook calls
 * - 2027-11-17: Improved initialization of all required data before hook calls
 * - 2027-11-17: Enhanced error boundaries and recovery mechanisms
 * - 2027-11-17: Added safeguards to prevent component rendering with incomplete data
 * - 2027-11-17: Restructured component to follow React best practices
 * - 2027-11-17: Added proper fallbacks for all conditional data
 * - 2027-11-19: Fixed TypeScript compatibility issues with hook return types
 * - 2028-11-10: Fixed progress percentage calculation to ignore default values
 * - 2028-11-11: Fixed totalSteps reference error in calculateFormProgress function
 * - 2028-11-12: Refactored into smaller, more maintainable components and hooks
 * - 2028-11-14: Fixed TypeScript errors with form extension types
 * - 2024-06-05: Removed FormProgress import that was causing build error
 * - 2024-06-05: Added back useStepNavigation import to fix build error
 * - 2024-06-10: Major refactoring - extracted components into separate files for better maintainability
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { StepForm } from "./StepForm";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { useFormSubmission } from "./submission/useFormSubmission";
import { ProgressPreservation } from "./submission/ProgressPreservation";
import { useFormProgress } from "./hooks/useFormProgress";
import { useValidationErrorTracking } from "./hooks/useValidationErrorTracking";
import { useFilteredSteps } from "./hooks/useFilteredSteps";
import { useFormDialogs } from "./hooks/useFormDialogs";
import { FormProgressIndicator } from "./components/FormProgressIndicator";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { FormContentLayout } from "./FormContentLayout";
import { FormDialogs } from "./components/FormDialogs";
import { useFormContentInit } from "./hooks/useFormContentInit";
import { FormSubmissionButtons } from "./components/FormSubmissionButtons";

interface FormContentProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
}

export const FormContent = ({ 
  session, 
  draftId,
  onDraftError,
  retryCount = 0
}: FormContentProps) => {
  const form = useCarListingForm(session.user.id, draftId);
  const navigate = useNavigate();
  
  // Form state management
  const [formState, setFormState] = useState({
    isInitializing: true,
    currentStep: 0,
    lastSaved: null as Date | null,
    carId: undefined as string | undefined,
    draftLoadError: null as Error | null,
    filteredStepsArray: [] as Array<any>,
    totalSteps: 1,
    hasInitializedHooks: false
  });

  // Form initialization and draft loading
  const { 
    isLoadingDraft, 
    draftError, 
    carId, 
    lastSaved, 
    resetDraftError, 
    handleFormError 
  } = useFormContentInit({
    session,
    form,
    draftId,
    onDraftError,
    retryCount
  });

  // Update carId and lastSaved from draft loading
  if (carId && carId !== formState.carId) {
    setFormState(prev => ({ ...prev, carId }));
  }
  
  if (lastSaved && lastSaved !== formState.lastSaved) {
    setFormState(prev => ({ ...prev, lastSaved }));
  }

  // Dialog management
  const { showSaveDialog, showSuccessDialog, actions: dialogActions } = useFormDialogs();

  // Section visibility management
  const { visibleSections } = useSectionsVisibility(form, formState.carId);
  
  // Form step filtering
  const { filteredSteps, typedStepConfigs } = useFilteredSteps({
    visibleSections,
    setFormState
  });

  // Step navigation
  const stepNavigation = useStepNavigation({
    form,
    totalSteps: formState.totalSteps,
    initialStep: formState.currentStep,
    saveProgress: async () => {
      return true;
    },
    filteredSteps: typedStepConfigs
  });

  // Form persistence
  const persistence = useFormPersistence({
    form,
    userId: session.user.id,
    carId: formState.carId,
    currentStep: stepNavigation.currentStep
  });

  // Update step navigation save function
  const saveWrapper = async () => {
    try {
      await persistence.saveImmediately();
      return true;
    } catch (error) {
      console.error('Error in save wrapper:', error);
      return false;
    }
  };
  
  stepNavigation.updateSaveFunction(saveWrapper);

  // Form submission
  const { handleSubmit: handleFormSubmit, isSubmitting, setShowSuccessDialog } = useFormSubmission(session.user.id);

  // Form progress calculation
  const { calculateFormProgress } = useFormProgress({
    form,
    currentStep: stepNavigation.currentStep,
    filteredStepsArray: formState.filteredStepsArray,
    completedSteps: stepNavigation.completedSteps,
    totalSteps: formState.totalSteps
  });

  // Validation error tracking
  const { getStepValidationErrors } = useValidationErrorTracking(form);
  
  // Calculate progress and errors
  const progress = calculateFormProgress();
  const stepErrors = getStepValidationErrors();
  
  // Compute completed steps array
  const completedStepsArray = Object.entries(stepNavigation.completedSteps)
    .filter(([, isCompleted]) => isCompleted)
    .map(([step]) => parseInt(step, 10));

  // Handle form submission
  const onSubmit = useCallback(
    async (data: import("@/types/forms").CarListingFormData) => {
      try {
        await handleFormSubmit(data, formState.carId);
        dialogActions.showSuccessDialog();
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [handleFormSubmit, formState.carId, dialogActions]
  );

  // Handle save and continue action
  const handleSaveAndContinue = useCallback(async () => {
    try {
      await persistence.saveImmediately();
      dialogActions.showSaveDialog();
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  }, [persistence, dialogActions]);

  // Return loading or error state if needed
  if (draftError && !formState.isInitializing) {
    return <FormContentLayout 
      form={form}
      isInitializing={formState.isInitializing}
      isLoadingDraft={isLoadingDraft}
      draftError={draftError}
      onDraftErrorRetry={resetDraftError}
      onFormSubmit={onSubmit}
      onFormError={handleFormError}
    >
      <div>Error loading form</div>
    </FormContentLayout>;
  }

  if (formState.isInitializing || isLoadingDraft) {
    return <FormContentLayout 
      form={form}
      isInitializing={formState.isInitializing}
      isLoadingDraft={isLoadingDraft}
      draftError={null}
      onDraftErrorRetry={resetDraftError}
      onFormSubmit={onSubmit}
      onFormError={handleFormError}
    >
      <div>Loading form...</div>
    </FormContentLayout>;
  }
  
  // Main form content
  return (
    <FormContentLayout
      form={form}
      isInitializing={formState.isInitializing}
      isLoadingDraft={isLoadingDraft}
      draftError={null}
      onDraftErrorRetry={resetDraftError}
      onFormSubmit={onSubmit}
      onFormError={handleFormError}
    >
      <ProgressPreservation 
        currentStep={stepNavigation.currentStep}
        lastSaved={formState.lastSaved}
        onOfflineStatusChange={persistence.setIsOffline}
      />
      
      <FormProgressIndicator 
        steps={formState.filteredStepsArray}
        currentStep={stepNavigation.currentStep}
        onStepChange={(step) => stepNavigation.setCurrentStep(step)}
        visibleSections={visibleSections}
        completedSteps={completedStepsArray}
        validationErrors={stepErrors}
      />
      
      <StepForm
        form={form}
        currentStep={stepNavigation.currentStep}
        setCurrentStep={(step) => stepNavigation.setCurrentStep(step)}
        carId={formState.carId}
        lastSaved={formState.lastSaved}
        isOffline={persistence.isOffline}
        isSaving={persistence.isSaving || isSubmitting}
        saveProgress={async () => {
          await persistence.saveImmediately();
          return true;
        }}
        visibleSections={visibleSections}
      />
      
      <FormSubmissionButtons
        isLastStep={stepNavigation.currentStep === formState.totalSteps - 1}
        isSubmitting={isSubmitting}
        isSaving={persistence.isSaving}
        isOffline={persistence.isOffline}
        onSaveAndContinue={handleSaveAndContinue}
        onSave={() => persistence.saveImmediately()}
        currentStep={stepNavigation.currentStep}
      />

      <FormDialogs 
        showSuccessDialog={showSuccessDialog}
        showSaveDialog={showSaveDialog}
        onSuccessDialogOpenChange={(open) => !open && dialogActions.hideSuccessDialog()}
        onSaveDialogOpenChange={(open) => !open && dialogActions.hideSaveDialog()}
        lastSaved={formState.lastSaved}
        carId={formState.carId}
      />
    </FormContentLayout>
  );
};
