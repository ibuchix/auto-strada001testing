/**
 * Form Content Component
 * - Manages the entire form state and initialization
 * - Updated: 2025-06-09: Enhanced valuation data initialization to ensure reserve price is set
 */

import { useEffect, useState, useCallback } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarListingFormData, carListingFormSchema } from "@/types/forms";
import { FormContainer } from "./components/FormContainer";
import { FormNavigationControls } from "./components/FormNavigationControls";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useCarData } from "./hooks/useCarData";
import { useDraftManagement } from "./hooks/useDraftManagement";
import { useFormSubmission } from "./hooks/useFormSubmission";

interface FormContentProps {
  session: any;
  draftId?: string;
  onDraftError?: (error: Error) => void;
  retryCount?: number;
  fromValuation?: boolean;
}

export const FormContent = ({
  session,
  draftId,
  onDraftError,
  retryCount = 0,
  fromValuation = false
}: FormContentProps) => {
  const form = useForm<CarListingFormData>({
    resolver: zodResolver(carListingFormSchema),
    defaultValues: {
      isSellingOnBehalf: false,
      hasServiceHistory: false,
      hasPrivatePlate: false,
      hasFinance: false,
      isDamaged: false,
    },
    mode: "onChange"
  });
  
  const {
    currentStep,
    totalSteps,
    goToNextStep,
    goToPrevStep,
    goToStep,
    hasStepErrors,
    getCurrentStepErrors,
  } = useStepNavigation(form);
  
  const { carId } = useCarData(session?.user?.id);
  
  const {
    isLoadingDraft,
    isSavingDraft,
    loadDraft,
    saveDraft,
    deleteDraft
  } = useDraftManagement(session?.user?.id, form, onDraftError);
  
  const {
    isSubmitting,
    handleSubmit,
    submissionError,
    submissionSuccess,
  } = useFormSubmission(session?.user?.id, carId, form);
  
  const [navigationDisabled, setNavigationDisabled] = useState(false);
  
  // Load draft when component mounts or retryCount changes
  useEffect(() => {
    if (draftId) {
      loadDraft(draftId);
    }
  }, [draftId, loadDraft, retryCount]);
  
  // Auto-save draft on changes, but debounce it
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (form.formState.isDirty && !isSubmitting && !isLoadingDraft) {
        saveDraft();
      }
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(debounceTimeout);
  }, [form.formState.isDirty, saveDraft, isSubmitting, isLoadingDraft]);
  
  // Handle form submission
  const onSubmit = async (data: CarListingFormData) => {
    setNavigationDisabled(true);
    await handleSubmit(data);
    setNavigationDisabled(false);
  };

  // Initialize form with data - enhanced to ensure valuation data properly sets reserve price
  useEffect(() => {
    if (fromValuation) {
      try {
        const valuationDataStr = localStorage.getItem('valuationData');
        if (valuationDataStr) {
          const valuationData = JSON.parse(valuationDataStr);
          console.log("Form initializing with valuation data:", valuationData);
          
          // Ensure reserve price is set from valuation data
          if (valuationData && (valuationData.reservePrice || valuationData.valuation)) {
            const reservePriceValue = valuationData.reservePrice || valuationData.valuation;
            if (reservePriceValue) {
              console.log("Setting reserve price from valuation:", reservePriceValue);
              form.setValue("reserve_price", reservePriceValue);
            }
          }
        }
      } catch (error) {
        console.error("Error loading valuation data:", error);
      }
    }
  }, [form, fromValuation]);

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        <FormContainer
          currentStep={currentStep}
          onNext={goToNextStep}
          onPrevious={goToPrevStep}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === totalSteps - 1}
          navigationDisabled={navigationDisabled}
          isSaving={isSavingDraft}
          carId={carId}
          userId={session?.user?.id}
        />
        
        <FormNavigationControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          onNext={goToNextStep}
          onPrevious={goToPrevStep}
          isFirstStep={currentStep === 0}
          isLastStep={currentStep === totalSteps - 1}
          navigationDisabled={navigationDisabled}
          isSaving={isSavingDraft}
          onSubmit={form.handleSubmit(onSubmit)}
          hasStepErrors={hasStepErrors()}
          getCurrentStepErrors={getCurrentStepErrors}
        />
      </form>
    </FormProvider>
  );
};
