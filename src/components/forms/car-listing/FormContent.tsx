
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
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { FormProvider } from "react-hook-form";
import { StepForm } from "./StepForm";
import { SuccessDialog } from "./SuccessDialog";
import { SaveProgressDialog } from "./SaveProgressDialog";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { useLoadDraft } from "./hooks/useLoadDraft";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { useFormSubmission } from "./submission/useFormSubmission";
import { ProgressPreservation } from "./submission/ProgressPreservation";
import { Session } from "@supabase/supabase-js";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { toast } from "sonner";
import { FormDataProvider } from "./context/FormDataContext";
import { FormErrorHandler } from "./FormErrorHandler";
import { useNavigate } from "react-router-dom";
import { FormProgress } from "./FormProgress";
import { useStepNavigation } from "./hooks/useStepNavigation";
// Import newly created hooks and components
import { LoadingState } from "./LoadingState";
import { useFormInitialization } from "./hooks/useFormInitialization";
import { useFormProgress } from "./hooks/useFormProgress";
import { useValidationErrorTracking } from "./hooks/useValidationErrorTracking";
import { useFilteredSteps } from "./hooks/useFilteredSteps";
import { useFormDialogs } from "./hooks/useFormDialogs";

interface FormContentProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
}

// Define StepConfig interface to match what useStepNavigation expects
interface StepConfig {
  id: string;
  validate?: () => boolean;
}

const DEFAULT_STEP_CONFIG = {
  id: 'default',
  validate: () => true
};

export const FormContent = ({ 
  session, 
  draftId,
  onDraftError,
  retryCount = 0
}: FormContentProps) => {
  // Always initialize the form at the top level, unconditionally
  const form = useCarListingForm(session.user.id, draftId);
  const navigate = useNavigate();
  
  // Use a single state object for all component state
  const [formState, setFormState] = useState({
    // Form management
    isInitializing: true,
    currentStep: 0,
    lastSaved: null as Date | null,
    carId: undefined as string | undefined,
    
    // Error handling
    draftLoadError: null as Error | null,
    
    // Form structure
    filteredStepsArray: [] as Array<any>,
    
    // Safe fallbacks for conditional logic
    totalSteps: 1,
    hasInitializedHooks: false
  });
  
  // Dialog state management
  const { showSaveDialog, showSuccessDialog, actions: dialogActions } = useFormDialogs();

  // Handle draft error
  const handleDraftError = useCallback((error: Error) => {
    console.error("Draft loading error:", error);
    setFormState(prev => ({ ...prev, draftLoadError: error }));
    
    if (onDraftError) {
      onDraftError(error);
    }
  }, [onDraftError]);

  // Draft loading - call unconditionally
  const { isLoading: isLoadingDraft, error } = useLoadDraft({
    form,
    userId: session.user.id,
    draftId,
    retryCount,
    onLoaded: (draft) => {
      setFormState(prev => ({ 
        ...prev, 
        carId: draft.carId, 
        lastSaved: draft.updatedAt,
        draftLoadError: null 
      }));
    },
    onError: handleDraftError
  });

  // Section visibility - call unconditionally
  const { visibleSections } = useSectionsVisibility(form, formState.carId);
  
  // Get filtered steps
  const { filteredSteps, typedStepConfigs } = useFilteredSteps({
    visibleSections,
    setFormState
  });

  // CRITICAL: Initialize step navigation with stable values to prevent conditional hook calls
  // This is called unconditionally BEFORE any conditional rendering
  const stepNavigation = useStepNavigation({
    form,
    totalSteps: formState.totalSteps,
    initialStep: formState.currentStep,
    saveProgress: async () => {
      // Safe empty function to prevent null errors
      return true;
    },
    filteredSteps: typedStepConfigs
  });

  // Form persistence - call unconditionally
  const persistence = useFormPersistence({
    form,
    userId: session.user.id,
    carId: formState.carId,
    currentStep: stepNavigation.currentStep // Use the value from step navigation
  });

  // Update step navigation with the actual save function after persistence is initialized
  useEffect(() => {
    // Create a wrapper that ensures boolean return type
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
  }, [stepNavigation, persistence.saveImmediately]);

  // Submission handling - call unconditionally
  const {
    handleSubmit: handleFormSubmit,
    isSubmitting,
    setShowSuccessDialog
  } = useFormSubmission(session.user.id);

  // Form initialization
  const { isInitializing, hasInitializedHooks } = useFormInitialization({ 
    form, 
    stepNavigation 
  });
  
  // Update initialization state
  useEffect(() => {
    setFormState(prev => ({ 
      ...prev, 
      isInitializing,
      hasInitializedHooks
    }));
  }, [isInitializing, hasInitializedHooks]);

  // Update the step when step navigation changes
  useEffect(() => {
    if (stepNavigation.currentStep !== formState.currentStep) {
      setFormState(prev => ({
        ...prev, 
        currentStep: stepNavigation.currentStep
      }));
    }
  }, [stepNavigation.currentStep, formState.currentStep]);

  // Sync persistence state
  useEffect(() => {
    if (persistence.lastSaved) {
      setFormState(prev => ({ ...prev, lastSaved: persistence.lastSaved }));
    }
  }, [persistence.lastSaved]);

  // Effect to clear draft error when retryCount changes
  useEffect(() => {
    if (retryCount > 0) {
      setFormState(prev => ({ ...prev, draftLoadError: null }));
    }
  }, [retryCount]);

  // Form submission handler
  const onSubmit = useCallback(
    async (data: import("@/types/forms").CarListingFormData) => {
      try {
        await handleFormSubmit(data, formState.carId);
        setFormState(prev => ({ 
          ...prev, 
          lastSaved: new Date()
        }));
        dialogActions.showSuccessDialog();
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [handleFormSubmit, formState.carId, dialogActions]
  );

  // Handle form error
  const handleFormError = useCallback((error: Error) => {
    console.error("Form error caught by boundary:", error);
    toast.error("An error occurred while loading the form", {
      description: "Please try refreshing the page"
    });
  }, []);

  // Handle save and continue action
  const handleSaveAndContinue = useCallback(async () => {
    try {
      await persistence.saveImmediately();
      dialogActions.showSaveDialog();
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress", {
        description: "Please try again or check your connection"
      });
    }
  }, [persistence, dialogActions]);

  // Calculate form progress
  const { calculateFormProgress } = useFormProgress({
    form,
    currentStep: formState.currentStep,
    filteredStepsArray: formState.filteredStepsArray,
    completedSteps: stepNavigation.completedSteps,
    totalSteps: formState.totalSteps
  });

  // Track validation errors
  const { getStepValidationErrors } = useValidationErrorTracking(form);
  
  // Calculate these values before the conditional rendering
  const progress = calculateFormProgress();
  const stepErrors = getStepValidationErrors();

  // Convert completedSteps from Record to array for compatibility with FormProgress
  const completedStepsArray = useMemo(() => {
    return Object.entries(stepNavigation.completedSteps).reduce((acc, [step, isCompleted]) => {
      if (isCompleted) {
        acc.push(parseInt(step, 10));
      }
      return acc;
    }, [] as number[]);
  }, [stepNavigation.completedSteps]);

  // Show draft loading error if there is one and initialization is complete
  if (formState.draftLoadError && !formState.isInitializing) {
    return <FormErrorHandler draftError={formState.draftLoadError} onRetry={() => setFormState(prev => ({ ...prev, draftLoadError: null }))} />;
  }

  // Show loading state when initializing or loading draft
  if (formState.isInitializing || isLoadingDraft) {
    return <LoadingState />;
  }
  
  return (
    <ErrorBoundary onError={handleFormError}>
      <FormProvider {...form}>
        <FormDataProvider form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <ProgressPreservation 
              currentStep={stepNavigation.currentStep}
              lastSaved={formState.lastSaved}
              onOfflineStatusChange={persistence.setIsOffline}
            />
            
            {/* Add FormProgress component showing completion status */}
            <FormProgress 
              progress={progress}
              steps={formState.filteredStepsArray}
              currentStep={stepNavigation.currentStep}
              onStepClick={(step) => stepNavigation.setCurrentStep(step)}
              completedSteps={completedStepsArray}
              errorSteps={stepErrors}
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
          </form>

          {/* Success dialog shown after form submission */}
          <SuccessDialog 
            open={showSuccessDialog}
            onOpenChange={(open) => !open && dialogActions.hideSuccessDialog()}
            lastSaved={formState.lastSaved}
            carId={formState.carId}
          />
          
          {/* Save progress dialog shown when user saves to continue later */}
          <SaveProgressDialog
            open={showSaveDialog}
            onOpenChange={(open) => !open && dialogActions.hideSaveDialog()}
            draftId={formState.carId}
          />
        </FormDataProvider>
      </FormProvider>
    </ErrorBoundary>
  );
};
