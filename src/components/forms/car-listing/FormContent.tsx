/**
 * Changes made:
 * - 2028-06-01: Added diagnostic panel and enhanced transaction tracking
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
  
  // Generate a unique ID for this form session
  useEffect(() => {
    if (!transactionIdRef.current) {
      transactionIdRef.current = crypto.randomUUID();
      
      // Log form initialization
      if (diagnosticId) {
        logDiagnostic('FORM_INIT', 'Form content initialized', {
          transactionId: transactionIdRef.current,
          draftId
        }, diagnosticId);
      }
    }
  }, [diagnosticId, draftId]);
  
  // Form state
  const form = useForm<CarListingFormData>({
    defaultValues: {
      vin: "",
      make: "",
      model: "",
      year: new Date().getFullYear(),
      registrationNumber: "",
      mileage: "",
      engineCapacity: "",
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
      previousOwners: "1",
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
    }
  });
  
  // Use form submission context
  const {
    submitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    resetTransaction
  } = useFormSubmissionContext();
  
  // Update component submitting state from context
  useEffect(() => {
    setIsSubmitting(submitting);
    
    // Log transaction status changes
    if (diagnosticId && transactionStatus) {
      logDiagnostic('TRANSACTION_STATUS', `Transaction status changed to ${transactionStatus}`, {
        transactionId: transactionIdRef.current,
        isSubmitting: submitting
      }, diagnosticId);
    }
  }, [submitting, transactionStatus, diagnosticId]);
  
  // Track submission errors
  useEffect(() => {
    if (error && error !== submissionErrorRef.current) {
      submissionErrorRef.current = error;
      
      // Log errors
      if (diagnosticId) {
        logDiagnostic('SUBMISSION_ERROR', 'Submission encountered an error', {
          error,
          transactionId: transactionIdRef.current
        }, diagnosticId, 'ERROR');
      }
    }
  }, [error, diagnosticId]);
  
  // Form persistence with autosave
  const { lastSaved, isOffline, saveProgress, carId } = useFormPersistence(
    form,
    session?.user?.id,
    currentStep,
    {
      diagnosticId,
      enableBackup: true
    }
  );
  
  // Sections visibility handling
  const { visibleSections } = useSectionsVisibility(form, carId);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Handle manual form submission
  const onSubmit = async (data: CarListingFormData) => {
    if (diagnosticId) {
      logDiagnostic('SUBMIT_ATTEMPT', 'Form submission started', {
        transactionId: transactionIdRef.current,
        carId
      }, diagnosticId);
    }
    
    try {
      // Reset any previous errors
      submissionErrorRef.current = null;
      
      // Save progress one last time before submitting
      await saveProgress();
      
      // Handle submission
      await handleSubmit(data, carId);
    } catch (error: any) {
      // Log submission errors
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
          {/* Form error display */}
          {error && <FormTransactionError error={error} onRetry={resetTransaction} />}
          
          {/* Success dialog */}
          <FormSuccessDialog
            open={showSuccessDialog}
            onClose={() => setShowSuccessDialog(false)}
          />
          
          {/* Step indicator */}
          <FormStepIndicator 
            currentStep={currentStep} 
            onStepClick={setCurrentStep}
            visibleSections={visibleSections}
          />
          
          {/* Multi-step form */}
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
          
          {/* Submit button */}
          <FormSubmitButton
            isSubmitting={isSubmitting}
            transactionStatus={transactionStatus}
            onRetry={resetTransaction}
            diagnosticId={diagnosticId}
            formData={form.getValues()}
          />
          
          {/* Debug panel */}
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
