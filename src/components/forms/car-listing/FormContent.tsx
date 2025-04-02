
/**
 * Changes made:
 * - Updated state management with useState hooks
 * - Improved draft loading with useLoadDraft hook
 * - Added proper form persistence
 * - Enhanced form submission handling with better error management
 * - Added loading state for draft loading
 * - Better TypeScript typing throughout the component
 * - 2025-08-02: Fixed naming to use isSubmitting instead of submitting
 * - 2025-08-03: Added ErrorBoundary and improved loading states
 * - 2025-08-04: Fixed type issues with saveProgress prop
 * - 2025-08-19: Added FormDataProvider to provide form context
 * - 2025-08-19: Fixed return type for persistence.saveImmediately
 * - 2025-10-01: Implemented periodic data saving for key form values
 * - 2025-11-02: Added error boundary integration with useLoadDraft
 * - 2025-11-03: Added support for retrying draft loading
 * - 2025-11-04: Added save and continue later functionality
 * - 2025-11-05: Fixed import issues for formSteps and FormProgress
 * - 2025-11-06: Fixed React hooks issue with conditional rendering
 * - 2025-11-07: Fixed TypeScript errors with STEP_FIELD_MAPPINGS import
 * - 2025-11-10: Fixed React hooks inconsistency in StepNavigation integration
 */

import { useState, useEffect, useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { StepForm } from "./StepForm";
import { SuccessDialog } from "./SuccessDialog";
import { SaveProgressDialog } from "./SaveProgressDialog";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { getFormDefaults } from "./hooks/useFormDefaults";
import { useLoadDraft } from "./hooks/useLoadDraft";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { useFormSubmission } from "./submission/useFormSubmission";
import { ProgressPreservation } from "./submission/ProgressPreservation";
import { Session } from "@supabase/supabase-js";
import { CarListingFormData } from "@/types/forms";
import { ErrorBoundary } from "@/components/error-boundary/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { FormDataProvider } from "./context/FormDataContext";
import { saveToCache, CACHE_KEYS } from "@/services/offlineCacheService";
import { FormErrorHandler } from "./FormErrorHandler";
import { useNavigate } from "react-router-dom";
import { formSteps } from "./constants/formSteps";
import { FormProgress } from "./FormProgress";
import { useStepNavigation, STEP_FIELD_MAPPINGS } from "./hooks/useStepNavigation";

interface FormContentProps {
  session: Session;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
}

const LoadingState = () => (
  <div className="space-y-8">
    <Skeleton className="h-12 w-full" />
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full" />
    </div>
    <Skeleton className="h-12 w-1/3 mx-auto" />
  </div>
);

export const FormContent = ({ 
  session, 
  draftId,
  onDraftError,
  retryCount = 0
}: FormContentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [carId, setCarId] = useState<string>();
  const [isInitializing, setIsInitializing] = useState(true);
  const [draftLoadError, setDraftLoadError] = useState<Error | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  // IMPORTANT: Create stepConfig state outside of conditionals
  const [filteredStepsArray, setFilteredStepsArray] = useState<Array<any>>([]);
  const form = useCarListingForm(session.user.id, draftId);
  const navigate = useNavigate();

  // Form state initialization
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setIsInitializing(true);
        const defaults = await getFormDefaults();
        form.reset(defaults);
      } catch (error) {
        console.error("Failed to initialize form defaults:", error);
        toast.error("Failed to load form defaults");
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeForm();
    
    // Cleanup function
    return () => {
      // Any cleanup needed for form initialization
    };
  }, [form]);

  // Handle draft error
  const handleDraftError = useCallback((error: Error) => {
    console.error("Draft loading error:", error);
    setDraftLoadError(error);
    
    if (onDraftError) {
      onDraftError(error);
    }
  }, [onDraftError]);

  // Draft loading
  const { isLoading: isLoadingDraft, error } = useLoadDraft({
    form,
    userId: session.user.id,
    draftId,
    retryCount,
    onLoaded: (draft) => {
      setCarId(draft.carId);
      setLastSaved(draft.updatedAt);
      setDraftLoadError(null);
    },
    onError: handleDraftError
  });

  // Form persistence
  const persistence = useFormPersistence({
    form,
    userId: session.user.id,
    carId,
    currentStep
  });

  // Submission handling
  const {
    showSuccessDialog,
    handleSubmit: handleFormSubmit,
    isSubmitting,
    setShowSuccessDialog
  } = useFormSubmission(session.user.id);

  // Form submission handler
  const onSubmit = useCallback(
    async (data: CarListingFormData) => {
      try {
        await handleFormSubmit(data, carId);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [handleFormSubmit, carId]
  );

  // Sync persistence state
  useEffect(() => {
    if (persistence.lastSaved) setLastSaved(persistence.lastSaved);
  }, [persistence.lastSaved]);

  // Section visibility
  const { visibleSections } = useSectionsVisibility(form, carId);

  // Handle errors during form loading
  const handleFormError = useCallback((error: Error) => {
    console.error("Form error caught by boundary:", error);
    toast.error("An error occurred while loading the form", {
      description: "Please try refreshing the page"
    });
  }, []);

  // Initial data loading with error handling
  useEffect(() => {
    try {
      form.loadInitialData && form.loadInitialData();
    } catch (error) {
      console.error('Form initialization error:', error);
      toast.error('Failed to load initial form data', {
        description: 'Please refresh the page or try again later',
        action: {
          label: 'Retry',
          onClick: () => window.location.reload()
        }
      });
    }
  }, [form]);

  // Periodic saving of key form values
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const formValues = form.getValues();
        saveToCache(CACHE_KEYS.TEMP_MILEAGE, formValues.mileage?.toString() || '');
        saveToCache(CACHE_KEYS.TEMP_VIN, formValues.vin || '');
        saveToCache(CACHE_KEYS.FORM_STEP, currentStep.toString());
        
        console.log('Periodic save completed', new Date().toISOString());
      } catch (error) {
        console.error('Periodic save failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [form, currentStep]);

  // Effect to clear draft error when retryCount changes
  useEffect(() => {
    if (retryCount > 0) {
      setDraftLoadError(null);
    }
  }, [retryCount]);

  // Update filtered steps based on visible sections
  useEffect(() => {
    const filtered = formSteps.filter(step => {
      return step.sections.some(section => visibleSections.includes(section));
    });
    setFilteredStepsArray(filtered);
  }, [visibleSections]);

  // Handle save and continue action
  const handleSaveAndContinue = useCallback(async () => {
    try {
      await persistence.saveImmediately();
      setShowSaveDialog(true);
    } catch (error) {
      console.error("Error saving progress:", error);
      toast.error("Failed to save progress", {
        description: "Please try again or check your connection"
      });
    }
  }, [persistence]);

  // Calculate form progress based on completed steps and current form data
  const calculateFormProgress = useCallback(() => {
    const formValues = form.getValues();
    let totalFields = 0;
    let completedFields = 0;
    
    // Count all fields in the form
    Object.entries(formValues).forEach(([key, value]) => {
      if (key === 'seller_id' || key === 'valuation_data') return; // Skip system fields
      
      totalFields++;
      
      // Check if the field has a value
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object') {
          // For objects like features, check if any property is true
          if (Array.isArray(value)) {
            if (value.length > 0) completedFields++;
          } else if (Object.values(value).some(v => v)) {
            completedFields++;
          }
        } else {
          completedFields++;
        }
      }
    });
    
    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }, [form]);

  // Get validation errors by step for progress tracking
  const getStepValidationErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    const stepErrors: Record<string, boolean> = {};
    
    // Map errors to steps
    Object.keys(formErrors).forEach(fieldName => {
      for (const [stepId, fields] of Object.entries(STEP_FIELD_MAPPINGS)) {
        if (fields.includes(fieldName as keyof CarListingFormData)) {
          stepErrors[stepId] = true;
          break;
        }
      }
    });
    
    return stepErrors;
  }, [form.formState.errors]);

  // Show draft loading error if there is one
  if (draftLoadError && !isInitializing) {
    return <FormErrorHandler draftError={draftLoadError} />;
  }

  // Show loading state when initializing or loading draft
  if (isInitializing || isLoadingDraft) {
    return <LoadingState />;
  }

  // Initialize step navigation EARLY and UNCONDITIONALLY to avoid hook ordering issues
  const stepNavigation = useStepNavigation({
    form,
    totalSteps: filteredStepsArray.length,
    initialStep: currentStep,
    saveProgress: persistence.saveImmediately,
    filteredSteps: filteredStepsArray
  });
  
  const progress = calculateFormProgress();
  const stepErrors = getStepValidationErrors();

  return (
    <ErrorBoundary onError={handleFormError}>
      <FormProvider {...form}>
        <FormDataProvider form={form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <ProgressPreservation 
              currentStep={currentStep}
              lastSaved={lastSaved}
              onOfflineStatusChange={persistence.setIsOffline}
            />
            
            {/* Add FormProgress component showing completion status */}
            <FormProgress 
              progress={progress}
              steps={formSteps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
              completedSteps={stepNavigation.completedSteps}
              errorSteps={stepErrors}
            />
            
            <StepForm
              form={form}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              carId={carId}
              lastSaved={lastSaved}
              isOffline={persistence.isOffline}
              isSaving={persistence.isSaving || isSubmitting}
              saveProgress={persistence.saveImmediately}
              visibleSections={visibleSections}
            />
          </form>

          {/* Success dialog shown after form submission */}
          <SuccessDialog 
            open={showSuccessDialog}
            onOpenChange={(open) => !open && setShowSuccessDialog(false)}
            lastSaved={lastSaved}
            carId={carId}
          />
          
          {/* Save progress dialog shown when user saves to continue later */}
          <SaveProgressDialog
            open={showSaveDialog}
            onOpenChange={(open) => !open && setShowSaveDialog(false)}
            draftId={carId}
          />
        </FormDataProvider>
      </FormProvider>
    </ErrorBoundary>
  );
};
