
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
 */

import { useState, useEffect, useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { StepForm } from "./StepForm";
import { SuccessDialog } from "./SuccessDialog";
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

interface FormContentProps {
  session: Session;
  draftId?: string;
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

export const FormContent = ({ session, draftId }: FormContentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [carId, setCarId] = useState<string>();
  const [isInitializing, setIsInitializing] = useState(true);
  const form = useCarListingForm(session.user.id, draftId);

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

  // Draft loading
  const { isLoading: isLoadingDraft } = useLoadDraft({
    form,
    userId: session.user.id,
    draftId,
    onLoaded: (draft) => {
      setCarId(draft.carId);
      setLastSaved(draft.updatedAt);
    }
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
        // Error is already handled by the useFormSubmission hook
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

  // Show loading state when initializing or loading draft
  if (isInitializing || isLoadingDraft) {
    return <LoadingState />;
  }

  return (
    <ErrorBoundary onError={handleFormError}>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <ProgressPreservation 
            currentStep={currentStep}
            lastSaved={lastSaved}
            onOfflineStatusChange={persistence.setIsOffline}
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

        <SuccessDialog 
          open={showSuccessDialog}
          onOpenChange={(open) => !open && setShowSuccessDialog(false)}
          lastSaved={lastSaved}
          carId={carId}
        />
      </FormProvider>
    </ErrorBoundary>
  );
};
