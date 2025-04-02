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
 */

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useStepNavigation } from "./hooks/useStepNavigation";

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
    
    // UI state
    showSaveDialog: false,
    showSuccessDialog: false,
    
    // Form structure
    filteredStepsArray: [] as Array<any>,
    
    // Safe fallbacks for conditional logic
    totalSteps: 1,
    hasInitializedHooks: false
  });
  
  // Memoize default values to prevent unnecessary recalculations
  const defaultSteps = useMemo(() => [DEFAULT_STEP_CONFIG], []);

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
  
  // Calculate filtered steps based on visible sections - memoized to prevent unnecessary recalculations
  const filteredSteps = useMemo(() => {
    // Ensure we always return at least one step to prevent conditional hook calls
    const filtered = formSteps.filter(step => {
      return step.sections.some(section => visibleSections.includes(section));
    });
    
    return filtered.length > 0 ? filtered : defaultSteps;
  }, [visibleSections, defaultSteps]);

  // Update filtered steps in state whenever they change
  useEffect(() => {
    setFormState(prev => ({
      ...prev,
      filteredStepsArray: filteredSteps,
      totalSteps: Math.max(filteredSteps.length, 1)
    }));
  }, [filteredSteps]);

  // Create properly typed step config array for useStepNavigation
  const typedStepConfigs = useMemo(() => {
    return filteredSteps.map(step => {
      return {
        id: step.id,
        validate: step.validate 
          ? () => (step.validate ? step.validate(form.getValues()) : true)
          : undefined
      } as StepConfig;
    });
  }, [filteredSteps, form]);

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

  // Form initialization - run once and set loading state
  useEffect(() => {
    const initializeForm = async () => {
      try {
        setFormState(prev => ({ ...prev, isInitializing: true }));
        const defaults = await getFormDefaults();
        form.reset(defaults);
        
        // Try to load initial data
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
      } catch (error) {
        console.error("Failed to initialize form defaults:", error);
        toast.error("Failed to load form defaults");
      } finally {
        // Mark initialization as complete
        setFormState(prev => ({ ...prev, isInitializing: false, hasInitializedHooks: true }));
      }
    };
    
    initializeForm();
  }, [form]);

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

  // Periodic saving of key form values
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const formValues = form.getValues();
        saveToCache(CACHE_KEYS.TEMP_MILEAGE, formValues.mileage?.toString() || '');
        saveToCache(CACHE_KEYS.TEMP_VIN, formValues.vin || '');
        saveToCache(CACHE_KEYS.FORM_STEP, stepNavigation.currentStep.toString());
        
        console.log('Periodic save completed', new Date().toISOString());
      } catch (error) {
        console.error('Periodic save failed:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [form, stepNavigation.currentStep]);

  // Form submission handler
  const onSubmit = useCallback(
    async (data: CarListingFormData) => {
      try {
        await handleFormSubmit(data, formState.carId);
        setFormState(prev => ({ 
          ...prev, 
          lastSaved: new Date(),
          showSuccessDialog: true
        }));
      } catch (error) {
        console.error("Form submission error:", error);
      }
    },
    [handleFormSubmit, formState.carId]
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
      setFormState(prev => ({ ...prev, showSaveDialog: true }));
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
    const defaultValues = getFormDefaults();
    let totalFields = 0;
    let completedFields = 0;
    
    // Get the total number of steps for use in calculations
    const totalSteps = formState.totalSteps;
    
    // Count all fields in the form that are visible in current step and previous steps
    Object.entries(formValues).forEach(([key, value]) => {
      if (key === 'seller_id' || key === 'valuation_data' || key === 'form_metadata') return; // Skip system fields
      
      // Only count fields from visible sections
      let fieldIsInVisibleSection = false;
      
      // Check if field is relevant to current or previous steps
      for (let i = 0; i <= formState.currentStep; i++) {
        if (i >= formState.filteredStepsArray.length) continue;
        
        const stepId = formState.filteredStepsArray[i]?.id;
        if (!stepId) continue;
        
        const fieldsInStep = STEP_FIELD_MAPPINGS[stepId] || [];
        if ((fieldsInStep as string[]).includes(key)) {
          fieldIsInVisibleSection = true;
          break;
        }
      }
      
      if (!fieldIsInVisibleSection) return;
      
      totalFields++;
      
      // Get default value for comparison
      const defaultValue = defaultValues[key as keyof typeof defaultValues];
      
      // Compare with default value to see if it's been modified
      const isModified = (() => {
        // Skip empty values
        if (value === undefined || value === null || value === '') {
          return false;
        }
        
        // For arrays, check if non-empty and different from default
        if (Array.isArray(value)) {
          if (value.length === 0) return false;
          
          // If default is also an array, compare contents
          if (Array.isArray(defaultValue) && defaultValue.length === value.length) {
            // Deep comparison would be better, but for simplicity checking length
            return true; // Consider any array with items as modified
          }
          
          return true;
        } 
        
        // For objects like features, check if any property differs from default
        if (typeof value === 'object' && value !== null) {
          if (typeof defaultValue === 'object' && defaultValue !== null) {
            // For features object, check if any feature is enabled that's not default
            return Object.entries(value).some(([propKey, propValue]) => {
              const defaultPropValue = defaultValue[propKey as keyof typeof defaultValue];
              return propValue !== defaultPropValue && propValue !== false;
            });
          }
          return Object.values(value).some(v => Boolean(v));
        } 
        
        // For primitive values
        if (typeof value === 'string' && value.trim() === '') return false;
        if (value === defaultValue) return false;
        
        // Consider number values as modified even if they're 0
        if (typeof value === 'number') return true;
        
        // All other truthy values
        return Boolean(value);
      })();
      
      if (isModified) {
        completedFields++;
      }
    });
    
    // Calculate more accurate percentage based on fields
    let progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
    
    // Factor in step completion - give more weight to step completion as user progresses
    const completedStepsCount = Object.values(stepNavigation.completedSteps).filter(Boolean).length;
    const stepProgress = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;
    
    // Weight the progress more toward field completion at the beginning
    // and more toward step completion at the end
    const stepRatio = Math.min(formState.currentStep / (totalSteps - 1), 1);
    progress = Math.round(progress * (1 - stepRatio * 0.5) + stepProgress * (stepRatio * 0.5));
    
    // Ensure minimum progress is shown when form is started (psychological benefit)
    return Math.max(progress, formState.currentStep > 0 ? 10 : 5);
  }, [form, formState.currentStep, formState.filteredStepsArray, stepNavigation.completedSteps, formState.totalSteps]);

  // Get validation errors by step for progress tracking
  const getStepValidationErrors = useCallback(() => {
    const formErrors = form.formState.errors;
    const stepErrors: Record<string, boolean> = {};
    
    // Map errors to steps
    Object.keys(formErrors).forEach(fieldName => {
      for (const [stepId, fields] of Object.entries(STEP_FIELD_MAPPINGS)) {
        if ((fields as string[]).includes(fieldName)) {
          stepErrors[stepId] = true;
          break;
        }
      }
    });
    
    return stepErrors;
  }, [form.formState.errors]);
  
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
              steps={formSteps}
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
            open={formState.showSuccessDialog}
            onOpenChange={(open) => !open && setFormState(prev => ({...prev, showSuccessDialog: false}))}
            lastSaved={formState.lastSaved}
            carId={formState.carId}
          />
          
          {/* Save progress dialog shown when user saves to continue later */}
          <SaveProgressDialog
            open={formState.showSaveDialog}
            onOpenChange={(open) => !open && setFormState(prev => ({...prev, showSaveDialog: false}))}
            draftId={formState.carId}
          />
        </FormDataProvider>
      </FormProvider>
    </ErrorBoundary>
  );
};

// Import STEP_FIELD_MAPPINGS for error tracking
import { STEP_FIELD_MAPPINGS } from './hooks/useStepNavigation';
