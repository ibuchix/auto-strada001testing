/**
 * Changes made:
 * - 2028-06-01: Added diagnostic panel and enhanced transaction tracking
 * - 2023-07-15: Fixed type errors with mileage, previousOwners, and accidentHistory
 * - 2024-07-24: Fixed string to boolean conversion for isDamaged
 */

import { useRef, useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { StepForm } from "./StepForm";
import { Session } from "@supabase/supabase-js";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { useFormSubmissionContext } from "./submission/FormSubmissionProvider";
import { toast } from "sonner";
import { FormTransactionError } from "./submission/FormTransactionError";
import { FormSubmitButton } from "./FormSubmitButton";
import { FormSuccessDialog } from "./submission/FormSuccessDialog";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { FormDataProvider } from "./context/FormDataContext";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { FormStepIndicator } from "./FormStepIndicator";
import { TransactionDebugPanel } from "@/components/transaction/TransactionDebugPanel";
import { logDiagnostic } from "@/diagnostics/listingButtonDiagnostics";

interface FormContentProps {
  session: Session;
  draftId?: string;
  diagnosticId?: string;
}

export const FormContent = ({ 
  session, 
  draftId, 
  diagnosticId 
}: FormContentProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionErrorRef = useRef<string | null>(null);
  const transactionIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!transactionIdRef.current) {
      transactionIdRef.current = crypto.randomUUID();
      
      if (diagnosticId) {
        logDiagnostic('FORM_INIT', 'Form content initialized', {
          transactionId: transactionIdRef.current,
          draftId
        }, diagnosticId);
      }
    }
  }, [diagnosticId, draftId]);
  
  const form = useForm<CarListingFormData>({
    defaultValues: {
      vin: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      registrationNumber: "",
      mileage: 0,
      engineCapacity: 0,
      transmission: "manual",
      bodyType: "sedan",
      exteriorColor: "",
      interiorColor: "",
      numberOfDoors: "4",
      seatMaterial: "cloth",
      numberOfKeys: "1",
      price: "",
      location: "",
      description: "",
      name: "",
      address: "",
      mobileNumber: "",
      contactEmail: "",
      notes: "",
      previousOwners: 1,
      accidentHistory: "none",
      isDamaged: false,
      isRegisteredInPoland: true,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      serviceHistoryType: "full",
      sellerNotes: "",
      conditionRating: 3,
      features: {
        satNav: false,
        panoramicRoof: false,
        reverseCamera: false,
        heatedSeats: false,
        upgradedSound: false,
      },
      uploadedPhotos: [],
      additionalPhotos: [],
      requiredPhotos: {
        front: null,
        rear: null,
        interior: null,
        engine: null,
      },
      rimPhotos: {
        front_left: null,
        front_right: null,
        rear_left: null,
        rear_right: null,
      },
      warningLightPhotos: [],
      rimPhotosComplete: false,
      financeDocument: null,
      serviceHistoryFiles: [],
      userId: session?.user?.id,
    }
  });
  
  const {
    submitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    resetTransaction
  } = useFormSubmissionContext();
  
  useEffect(() => {
    setIsSubmitting(submitting);
    
    if (diagnosticId && transactionStatus) {
      logDiagnostic('TRANSACTION_STATUS', `Transaction status changed to ${transactionStatus}`, {
        transactionId: transactionIdRef.current,
        isSubmitting: submitting
      }, diagnosticId);
    }
  }, [submitting, transactionStatus, diagnosticId]);
  
  useEffect(() => {
    if (error && error !== submissionErrorRef.current) {
      submissionErrorRef.current = error;
      
      if (diagnosticId) {
        logDiagnostic('SUBMISSION_ERROR', 'Submission encountered an error', {
          error,
          transactionId: transactionIdRef.current
        }, diagnosticId, 'ERROR');
      }
    }
  }, [error, diagnosticId]);
  
  const { lastSaved, isOffline, saveProgress, carId } = useFormPersistence(
    form,
    session?.user?.id,
    currentStep,
    {
      diagnosticId,
      enableBackup: true
    }
  );
  
  const { visibleSections } = useSectionsVisibility(form, carId);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const onSubmit = async (data: CarListingFormData) => {
    if (diagnosticId) {
      logDiagnostic('SUBMIT_ATTEMPT', 'Form submission started', {
        transactionId: transactionIdRef.current,
        carId
      }, diagnosticId);
    }
    
    try {
      submissionErrorRef.current = null;
      
      await saveProgress();
      
      await handleSubmit(data, carId);
    } catch (error: any) {
      if (diagnosticId) {
        logDiagnostic('SUBMIT_ERROR', 'Error during form submission', {
          error: error.message,
          transactionId: transactionIdRef.current,
          carId
        }, diagnosticId, 'ERROR');
      }
      
      console.error('Form submission error:', error);
      toast.error('Form submission failed', {
        description: error.message || 'Please try again later',
        action: {
          label: 'Try Again',
          onClick: () => resetTransaction()
        }
      });
    }
  };
  
  if (!isMounted) {
    return <div className="p-8 text-center">Loading form...</div>;
  }
  
  return (
    <FormDataProvider form={form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24 relative">
          {error && <FormTransactionError error={error} onRetry={resetTransaction} />}
          
          <FormSuccessDialog
            open={showSuccessDialog}
            onClose={() => setShowSuccessDialog(false)}
          />
          
          <FormStepIndicator 
            currentStep={currentStep} 
            onStepClick={setCurrentStep}
            visibleSections={visibleSections}
          />
          
          <div>
            <StepForm
              form={form}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              carId={carId}
              lastSaved={lastSaved}
              isOffline={isOffline}
              saveProgress={saveProgress}
              formErrors={form.formState.errors}
              visibleSections={visibleSections}
              diagnosticId={diagnosticId}
            />
          </div>
          
          <FormSubmitButton
            isSubmitting={isSubmitting}
            transactionStatus={transactionStatus}
            onRetry={resetTransaction}
            diagnosticId={diagnosticId}
            formData={form.getValues()}
          />
          
          <TransactionDebugPanel 
            transactionId={transactionIdRef.current || undefined}
            transactionStatus={transactionStatus}
            formData={form.getValues()}
          />
        </form>
      </Form>
    </FormDataProvider>
  );
};
