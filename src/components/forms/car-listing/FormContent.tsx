
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
 * - 2024-06-20: Further refactoring - extracted more functionality into separate hooks and components
 * - 2024-06-21: Fixed TypeScript error with FormErrorSection component
 * - 2024-06-23: Fixed infinite re-render by consolidating progress tracking
 */

import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { useFormSubmission } from "./submission/useFormSubmission";
import { useFormProgress } from "./hooks/useFormProgress";
import { useValidationErrorTracking } from "./hooks/useValidationErrorTracking";
import { useFilteredSteps } from "./hooks/useFilteredSteps";
import { useFormDialogs } from "./hooks/useFormDialogs";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { FormContentLayout } from "./FormContentLayout";
import { FormDialogs } from "./components/FormDialogs";
import { useFormContentInit } from "./hooks/useFormContentInit";
import { useFormState } from "./hooks/useFormState";
import { FormProgressSection } from "./components/FormProgressSection";
import { FormErrorSection } from "./components/FormErrorSection";
import { MainFormContent } from "./components/MainFormContent";
import { useFormActions } from "./hooks/useFormActions";
import { useMemo } from "react";

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
  const { formState, updateFormState } = useFormState();
  
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
    updateFormState(prev => ({ ...prev, carId }));
  }
  
  if (lastSaved && lastSaved !== formState.lastSaved) {
    updateFormState(prev => ({ ...prev, lastSaved }));
  }

  // Dialog management
  const { showSaveDialog, showSuccessDialog, actions: dialogActions } = useFormDialogs();

  // Section visibility management
  const { visibleSections } = useSectionsVisibility(form, formState.carId);
  
  // Form step filtering
  const { filteredSteps, typedStepConfigs } = useFilteredSteps({
    visibleSections,
    setFormState: updateFormState
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
  
  // Only update save function when dependencies change
  // This helps prevent infinite loops
  stepNavigation.updateSaveFunction(saveWrapper);

  // Form submission
  const { handleSubmit: handleFormSubmit, isSubmitting } = useFormSubmission(session.user.id);

  // Form actions
  const { onSubmit, handleSaveAndContinue, handleSave } = useFormActions({
    handleFormSubmit,
    saveImmediately: persistence.saveImmediately,
    showSaveDialog: dialogActions.showSaveDialog,
    showSuccessDialog: dialogActions.showSuccessDialog
  });

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
  
  // Calculate progress and errors - memoize to prevent recalculation on every render
  const progress = useMemo(() => calculateFormProgress(), [calculateFormProgress]);
  const stepErrors = useMemo(() => getStepValidationErrors(), [getStepValidationErrors]);
  
  // Compute completed steps array - memoize to prevent recalculation
  const completedStepsArray = useMemo(() => {
    return Object.entries(stepNavigation.completedSteps)
      .filter(([, isCompleted]) => isCompleted)
      .map(([step]) => parseInt(step, 10));
  }, [stepNavigation.completedSteps]);

  // Return loading or error state if needed
  if (draftError && !formState.isInitializing) {
    return <FormContentLayout 
      form={form}
      isInitializing={formState.isInitializing}
      isLoadingDraft={isLoadingDraft}
      draftError={draftError}
      onDraftErrorRetry={resetDraftError}
      onFormSubmit={(data) => onSubmit(data, formState.carId)}
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
      onFormSubmit={(data) => onSubmit(data, formState.carId)}
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
      onFormSubmit={(data) => onSubmit(data, formState.carId)}
      onFormError={handleFormError}
    >
      <FormProgressSection
        currentStep={stepNavigation.currentStep}
        lastSaved={formState.lastSaved}
        onOfflineStatusChange={persistence.setIsOffline}
        steps={formState.filteredStepsArray}
        visibleSections={visibleSections}
        completedSteps={completedStepsArray}
        validationErrors={stepErrors}
        onStepChange={stepNavigation.setCurrentStep}
      />
      
      <FormErrorSection 
        validationErrors={stepNavigation.stepValidationErrors || {}}
      />
      
      <MainFormContent
        form={form}
        currentStep={stepNavigation.currentStep}
        setCurrentStep={stepNavigation.setCurrentStep}
        carId={formState.carId}
        lastSaved={formState.lastSaved}
        isOffline={persistence.isOffline}
        isSaving={persistence.isSaving}
        isSubmitting={isSubmitting}
        saveProgress={saveWrapper}
        visibleSections={visibleSections}
        totalSteps={formState.totalSteps}
        onSaveAndContinue={handleSaveAndContinue}
        onSave={handleSave}
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
