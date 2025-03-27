
/**
 * Changes made:
 * - Fixed import for getFormDefaults instead of useFormDefaults
 * - Added required props to SuccessDialog
 * - Fixed useLoadDraft parameters by passing required parameters
 * - Removed formErrors prop as it's not part of useSectionsVisibility return
 * - Fixed isSaving state to provide visual feedback when saving
 * - Created loadDraftOptions object to fix the useLoadDraft call
 * - Fixed TypeScript error by ensuring correct import and usage of useLoadDraft
 */

import { useState, useEffect } from "react";
import { FormProvider } from "react-hook-form";
import { StepForm } from "./StepForm";
import { SuccessDialog } from "./SuccessDialog";
import { useCarListingForm } from "./hooks/useCarListingForm";
import { getFormDefaults } from "./hooks/useFormDefaults";
import { useLoadDraft, LoadDraftOptions } from "./hooks/useLoadDraft";
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
  const [carId, setCarId] = useState<string | undefined>(undefined);
  
  const { showSuccessDialog, setShowSuccessDialog, handleSubmit } = useFormSubmission(session.user.id);
  
  // Initialize form with default values
  const form = useCarListingForm();
  
  // Set form defaults
  useEffect(() => {
    const defaults = getFormDefaults();
    Object.entries(defaults).forEach(([key, value]) => {
      form.setValue(key as any, value as any, { shouldValidate: false });
    });
  }, [form]);
  
  // Create options object for useLoadDraft
  const loadDraftOptions: LoadDraftOptions = {
    form,
    setCarId,
    setLastSaved,
    userId: session.user.id,
    draftId
  };
  
  // Load draft if draftId is provided
  useLoadDraft(loadDraftOptions);
  
  // Handle form persistence
  const persistence = useFormPersistence(form, session.user.id, currentStep);
  
  // Update state from persistence hooks
  useEffect(() => {
    if (persistence.lastSaved) {
      setLastSaved(persistence.lastSaved);
    }
    setIsOffline(persistence.isOffline);
    setIsSaving(persistence.isSaving);
    if (persistence.carId && !carId) {
      setCarId(persistence.carId);
    }
  }, [persistence.lastSaved, persistence.isOffline, persistence.isSaving, persistence.carId, carId]);
  
  // Determine which form sections to show
  const { visibleSections } = useSectionsVisibility(form, carId);
  
  // Handle form submission
  const onSubmit = (data: any) => {
    handleSubmit(data, carId);
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
          carId={carId}
          lastSaved={lastSaved}
          isOffline={isOffline}
          isSaving={isSaving}
          saveProgress={persistence.saveImmediately}
          visibleSections={visibleSections}
        />
      </form>
      
      {showSuccessDialog && (
        <SuccessDialog 
          open={showSuccessDialog} 
          onOpenChange={setShowSuccessDialog}
        />
      )}
    </FormProvider>
  );
};
