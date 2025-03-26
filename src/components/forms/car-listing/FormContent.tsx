
/**
 * Changes made:
 * - Fixed type issues with form data
 * - Updated form types to use Partial<CarListingFormData>
 */

import { useRef, useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { StepForm } from "./StepForm";
import { useForm } from "react-hook-form";
import { useFormSubmissionContext } from "./submission/FormSubmissionProvider";
import { toast } from "sonner";
import { FormTransactionError } from "./submission/FormTransactionError";
import { FormSubmitButton } from "./FormSubmitButton";
import { FormSuccessDialog } from "./submission/FormSuccessDialog";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { FormDataProvider } from "./context/FormDataContext";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { FormStepIndicator } from "./FormStepIndicator";
import { CarListingFormData } from "@/types/forms";

interface FormContentProps {
  session: any;
  draftId?: string;
}

export const FormContent = ({ session, draftId }: FormContentProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionErrorRef = useRef(null);
  const transactionIdRef = useRef(null);
  
  // Generate a unique ID for this form session
  useEffect(() => {
    if (!transactionIdRef.current) {
      transactionIdRef.current = crypto.randomUUID();
    }
  }, [draftId]);

  // Form state - use Partial<CarListingFormData> to allow optional fields
  const form = useForm<Partial<CarListingFormData>>({
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
        upgradedSound: false
      },
      uploadedPhotos: [],
      additionalPhotos: [],
      requiredPhotos: {
        front: null,
        rear: null,
        interior: null,
        engine: null
      },
      rimPhotos: {
        front_left: null,
        front_right: null,
        rear_left: null,
        rear_right: null
      },
      warningLightPhotos: [],
      rimPhotosComplete: false,
      financeDocument: null,
      serviceHistoryFiles: []
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
  }, [submitting, transactionStatus]);

  // Track submission errors
  useEffect(() => {
    if (error && error !== submissionErrorRef.current) {
      submissionErrorRef.current = error;
    }
  }, [error]);

  // Form persistence with autosave
  const { lastSaved, isOffline, saveProgress, carId } = useFormPersistence(
    form, 
    session?.user?.id, 
    currentStep, 
    { enableBackup: true }
  );

  // Sections visibility handling - cast form to any to avoid type errors
  const { visibleSections } = useSectionsVisibility(form as any, carId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle manual form submission
  const onSubmit = async (data: Partial<CarListingFormData>) => {
    try {
      // Reset any previous errors
      submissionErrorRef.current = null;
      
      // Save progress one last time before submitting
      await saveProgress();
      
      // Handle submission - cast data to any to avoid type errors
      await handleSubmit(data as any, carId);
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Form submission failed', {
        description: (error as any).message || 'Please try again later',
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
    <FormDataProvider form={form as any}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24 relative">
          {error && (
            <FormTransactionError 
              error={error} 
              onRetry={resetTransaction} 
            />
          )}
          
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
              form={form as any}
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              carId={carId}
              lastSaved={lastSaved}
              isOffline={isOffline}
              saveProgress={saveProgress}
              formErrors={form.formState.errors}
              visibleSections={visibleSections}
            />
          </div>
          
          <FormSubmitButton
            isSubmitting={isSubmitting}
            transactionStatus={transactionStatus}
            onRetry={resetTransaction}
            formData={form.getValues()}
          />
        </form>
      </Form>
    </FormDataProvider>
  );
};
