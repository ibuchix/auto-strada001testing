
/**
 * Changes made:
 * - Added isSaving state to provide visual feedback when saving
 */

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { StepForm } from "./StepForm";
import { SuccessDialog } from "./SuccessDialog";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { useFormDefaults } from "./hooks/useFormDefaults";
import { useLoadDraft } from "./hooks/useLoadDraft";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { useFormSubmission } from "./submission/useFormSubmission";
import { ProgressPreservation } from "./submission/ProgressPreservation";
import { Session } from "@supabase/supabase-js";

interface FormContentProps {
  session: Session;
  draftId?: string;
}

export const FormContent = ({ session, draftId }: FormContentProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { showSuccessDialog, handleSubmit } = useFormSubmission(session.user.id);
  
  // Initialize form with default values
  const form = useCarListingForm();
  useFormDefaults(form);
  
  // Load draft if draftId is provided
  useLoadDraft(form, draftId, session.user.id);
  
  // Handle form persistence
  const persistence = useFormPersistence(form, session.user.id, currentStep);
  
  // Update state from persistence hooks
  useEffect(() => {
    if (persistence.lastSaved) {
      setLastSaved(persistence.lastSaved);
    }
    setIsOffline(persistence.isOffline);
    setIsSaving(persistence.isSaving);
  }, [persistence.lastSaved, persistence.isOffline, persistence.isSaving]);
  
  // Determine which form sections to show
  const { visibleSections, formErrors } = useSectionsVisibility(form);
  
  // Handle form submission
  const onSubmit = (data: any) => {
    handleSubmit(data, persistence.carId);
  };
  
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <ProgressPreservation 
          currentStep={currentStep}
          onLastSavedChange={setLastSaved}
          onOfflineStatusChange={setIsOffline}
        />
        
        <StepForm
          form={form}
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          carId={persistence.carId}
          lastSaved={lastSaved}
          isOffline={isOffline}
          isSaving={isSaving}
          saveProgress={persistence.saveImmediately}
          formErrors={formErrors}
          visibleSections={visibleSections}
        />
      </form>
      
      {showSuccessDialog && (
        <SuccessDialog />
      )}
    </FormProvider>
  );
};
