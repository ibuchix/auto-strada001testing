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
  
  useEffect(() => {
    if (!transactionIdRef.current) {
      transactionIdRef.current = crypto.randomUUID();
    }
  }, [draftId]);

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
  }, [submitting, transactionStatus]);

  useEffect(() => {
    if (error && error !== submissionErrorRef.current) {
      submissionErrorRef.current = error;
    }
  }, [error]);

  const { lastSaved, isOffline, saveProgress, carId } = useFormPersistence(
    form, 
    session?.user?.id, 
    currentStep, 
    { enableBackup: true }
  );

  const { visibleSections } = useSectionsVisibility(form as any, carId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const onSubmit = async (data: Partial<CarListingFormData>) => {
    try {
      submissionErrorRef.current = null;
      await saveProgress();
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
