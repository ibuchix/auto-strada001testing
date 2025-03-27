
/**
 * Changes made:
 * - Updated state management with useState hooks
 * - Improved draft loading with useLoadDraft hook
 * - Added proper form persistence
 * - Enhanced form submission handling with better error management
 * - Added loading state for draft loading
 * - Better TypeScript typing throughout the component
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

interface FormContentProps {
  session: Session;
  draftId?: string;
}

export const FormContent = ({ session, draftId }: FormContentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [carId, setCarId] = useState<string>();
  const form = useCarListingForm(session.user.id, draftId);

  // Form state initialization
  useEffect(() => {
    const initializeForm = async () => {
      const defaults = await getFormDefaults();
      form.reset(defaults);
    };
    initializeForm();
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
      await handleFormSubmit(data, carId);
      setLastSaved(new Date());
    },
    [handleFormSubmit, carId]
  );

  // Sync persistence state
  useEffect(() => {
    if (persistence.lastSaved) setLastSaved(persistence.lastSaved);
  }, [persistence.lastSaved]);

  // Section visibility
  const { visibleSections } = useSectionsVisibility(form, carId);

  if (isLoadingDraft) {
    return <div>Loading draft...</div>;
  }

  return (
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
  );
};
