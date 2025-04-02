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
 * - 2024-06-24: Added proper memoization of state updates and callbacks to prevent loops
 * - 2024-06-25: Fixed component communication to ensure one-way data flow
 * - 2024-06-27: Fixed dependency arrays in useEffect hooks to prevent unnecessary renders
 * - 2024-06-27: Added refs for values that shouldn't trigger effect reruns
 * - 2024-06-27: Optimized state updates to reduce render cycles
 * - 2026-05-15: Updated import for refactored useFormPersistence hook
 * - 2028-06-28: Refactored into smaller components with better separation of concerns
 * - 2028-05-15: Added comprehensive error handling and debugging
 * - 2028-05-15: Added detailed debugging logs for key state changes
 * - 2028-05-15: Wrapped critical sections in error boundaries
 * - 2028-05-18: Fixed form initialization to prevent stuck loading state
 * - 2028-05-19: Fixed form context issue causing "form.formState is undefined" error
 * - 2028-05-20: Added missing Alert component imports
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
import { useCallback, useMemo, useEffect, memo, useRef } from "react";
import { FormDataProvider } from "./context/FormDataContext";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { FormErrorProvider } from "./context/FormErrorContext";
import { useDebugRender } from "./hooks/useDebugRender";
import { LoadingState } from "./LoadingState";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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
  const navigate = useNavigate();
  
  const { debugLog } = useDebugRender('FormContent', {
    trackDeps: { session: !!session, draftId, retryCount }
  });
  
  debugLog('Initializing form content component');
  
  // Form initialization - must happen first
  const form = useCarListingForm(session.user.id, draftId);
  
  // Form state management
  const { formState, updateFormState } = useFormState();
  
  // Use refs for values that shouldn't trigger effect reruns
  const carIdRef = useRef<string | undefined>(formState.carId);
  const lastSavedRef = useRef<Date | null>(formState.lastSaved);
  
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

  // Update carId and lastSaved from draft loading - use refs to prevent render-time updates
  useEffect(() => {
    if (carId && carId !== carIdRef.current) {
      carIdRef.current = carId;
      updateFormState(prev => ({ ...prev, carId }));
    }
    
    if (lastSaved && (!lastSavedRef.current || lastSaved.getTime() !== lastSavedRef.current.getTime())) {
      lastSavedRef.current = lastSaved;
      updateFormState(prev => ({ ...prev, lastSaved }));
    }
  }, [carId, lastSaved, updateFormState]);

  // Dialog management
  const { showSaveDialog, showSuccessDialog, actions: dialogActions } = useFormDialogs();

  // Section visibility management - memoize dependencies
  const { visibleSections } = useSectionsVisibility(form, formState.carId);
  
  // Form step filtering
  const { filteredSteps, typedStepConfigs } = useFilteredSteps({
    visibleSections,
    setFormState: updateFormState
  });

  // Create a stable initialization object for step navigation
  const stepNavigationConfig = useMemo(() => ({
    form,
    totalSteps: formState.totalSteps,
    initialStep: formState.currentStep,
    saveProgress: async () => {
      return true; // Will be updated after initialization
    },
    filteredSteps: typedStepConfigs
  }), [form, formState.totalSteps, formState.currentStep, typedStepConfigs]);

  // Step navigation - use memoized config
  const stepNavigation = useStepNavigation(stepNavigationConfig);

  // Create a memoized save function to prevent recreation on every render
  const persistence = useFormPersistence({
    form,
    userId: session.user.id,
    carId: formState.carId,
    currentStep: stepNavigation.currentStep
  });

  // Create a memoized save wrapper function with stable identity
  const saveWrapper = useCallback(async () => {
    try {
      await persistence.saveImmediately();
      return true;
    } catch (error) {
      console.error('Error in save wrapper:', error);
      return false;
    }
  }, [persistence]);
  
  // Store initial save function reference
  const initialSaveRef = useRef(saveWrapper);

  // Update step navigation save function once on mount and when saveWrapper changes
  // Use a ref to track if we've already set it to prevent loops
  const hasUpdatedSaveFunctionRef = useRef(false);
  
  useEffect(() => {
    // Either this is the first time or saveWrapper has changed
    if (!hasUpdatedSaveFunctionRef.current || initialSaveRef.current !== saveWrapper) {
      stepNavigation.updateSaveFunction(saveWrapper);
      initialSaveRef.current = saveWrapper;
      hasUpdatedSaveFunctionRef.current = true;
    }
  }, [stepNavigation, saveWrapper]);

  // Form submission - must happen after form is initialized
  const { handleSubmit: handleFormSubmit, isSubmitting } = useFormSubmission(session.user.id);

  // Form actions - memoize with stable dependencies to prevent recreation
  const formActionsConfig = useMemo(() => ({
    handleFormSubmit,
    saveImmediately: persistence.saveImmediately,
    showSaveDialog: dialogActions.showSaveDialog,
    showSuccessDialog: dialogActions.showSuccessDialog
  }), [handleFormSubmit, persistence.saveImmediately, dialogActions.showSaveDialog, dialogActions.showSuccessDialog]);
  
  const { onSubmit, handleSaveAndContinue, handleSave } = useFormActions(formActionsConfig);

  // Form progress calculation - use stable props to prevent recreation
  const progressConfig = useMemo(() => ({
    form,
    currentStep: stepNavigation.currentStep,
    filteredStepsArray: formState.filteredStepsArray,
    completedSteps: stepNavigation.completedSteps,
    totalSteps: formState.totalSteps
  }), [form, stepNavigation.currentStep, formState.filteredStepsArray, stepNavigation.completedSteps, formState.totalSteps]);
  
  const { calculateFormProgress } = useFormProgress(progressConfig);

  // Validation error tracking - with stable dependency
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
  
  // Create memoized handlers for child components to prevent recreation on every render
  const handleStepChange = useCallback((step: number) => {
    stepNavigation.setCurrentStep(step);
  }, [stepNavigation]);

  const handleOfflineStatusChange = useCallback((status: boolean) => {
    persistence.setIsOffline(status);
  }, [persistence]);
  
  // Create a stable submit handler with minimal dependencies
  const handleFormSubmit2 = useCallback((data: any) => {
    return onSubmit(data, formState.carId);
  }, [onSubmit, formState.carId]);

  // Create error handler for critical sections
  const handleComponentError = useCallback((error: Error, errorInfo?: React.ErrorInfo) => {
    debugLog('Component error caught', error);
    
    if (onDraftError && error.message.includes('draft')) {
      onDraftError(error);
    } else if (handleFormError) {
      handleFormError(error);
    } else {
      console.error('Unhandled form error:', error, errorInfo);
    }
  }, [onDraftError, handleFormError, debugLog]);

  // Force form out of initializing state after a timeout
  useEffect(() => {
    // If still initializing after 10 seconds, force-exit the loading state
    const timeout = setTimeout(() => {
      if (formState.isInitializing) {
        console.warn('Form still initializing after timeout, forcing ready state');
        updateFormState(prev => ({
          ...prev,
          isInitializing: false,
          hasInitializedHooks: true
        }));
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [formState.isInitializing, updateFormState]);

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
            onDraftErrorRetry={resetDraftError}
            onFormSubmit={handleFormSubmit2}
            onFormError={handleFormError}
            layoutId={formState.carId || 'new-form'}
          >
            {!formState.isInitializing && !isLoadingDraft && (
              <>
                <FormProgressSection
                  currentStep={stepNavigation.currentStep}
                  lastSaved={formState.lastSaved}
                  onOfflineStatusChange={handleOfflineStatusChange}
                  steps={formState.filteredStepsArray}
                  visibleSections={visibleSections}
                  completedSteps={completedStepsArray}
                  validationErrors={stepErrors}
                  onStepChange={handleStepChange}
                />
                
                <FormErrorSection 
                  validationErrors={stepNavigation.stepValidationErrors || {}}
                  showDetails={process.env.NODE_ENV !== 'production'}
                />
                
                <ErrorBoundary
                  boundary="main-form-content"
                  resetOnPropsChange
                  onError={(error) => {
                    handleComponentError(error);
                    debugLog('Error in main content section', error);
                  }}
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
                    currentStep={stepNavigation.currentStep}
                    setCurrentStep={handleStepChange}
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
                </ErrorBoundary>

                <FormDialogs 
                  showSuccessDialog={showSuccessDialog}
                  showSaveDialog={showSaveDialog}
                  onSuccessDialogOpenChange={(open) => !open && dialogActions.hideSuccessDialog()}
                  onSaveDialogOpenChange={(open) => !open && dialogActions.hideSaveDialog()}
                  lastSaved={formState.lastSaved}
                  carId={formState.carId}
                />
              </>
            )}
          </FormContentLayout>
        </FormDataProvider>
      </FormErrorProvider>
    </ErrorBoundary>
  );
});

// Add display name for better debugging
FormContent.displayName = 'FormContent';
