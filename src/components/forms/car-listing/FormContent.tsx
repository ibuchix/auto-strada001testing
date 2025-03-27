
/**
 * Changes made:
 * - Fixed type comparison errors by importing and using TransactionStatus enum
 * - Used proper enum values instead of string literals for transaction status checks
 * - Cleaned up imports and code structure
 * - Optimized form step navigation to be independent of save operations
 * - Added better loading indicators and error handling
 */

import { useRef, useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { StepForm } from "./StepForm";
import { useForm } from "react-hook-form";
import { useFormSubmissionContext } from "./submission/FormSubmissionProvider";
import { toast } from "sonner";
import { FormTransactionError } from "./submission/FormTransactionError";
import { FormSuccessDialog } from "./submission/FormSuccessDialog";
import { useFormPersistence } from "./hooks/useFormPersistence";
import { FormDataProvider } from "./context/FormDataContext";
import { useSectionsVisibility } from "./hooks/useSectionsVisibility";
import { CarListingFormData } from "@/types/forms";
import { formSteps } from "./constants/formSteps";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TransactionStatus } from "@/services/supabase/transactions/types";

interface FormContentProps {
  session: any;
  draftId?: string;
}

export const FormContent = ({ session, draftId }: FormContentProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
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

  // Debounced save handler with visual feedback
  const handleSaveProgress = async () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      setSaveTimeout(null);
    }
    
    setIsSaving(true);
    
    try {
      await saveProgress();
    } catch (error) {
      console.error('Error saving form progress:', error);
    } finally {
      // Show saving indicator for at least 500ms for better UX
      const timeout = setTimeout(() => {
        setIsSaving(false);
        setSaveTimeout(null);
      }, 500);
      
      setSaveTimeout(timeout);
    }
  };

  // Handle navigation between steps without blocking UI
  const handleStepChange = (newStep: number) => {
    // First update the step immediately
    setCurrentStep(newStep);
    
    // Then trigger save in the background without blocking
    handleSaveProgress();
  };

  const onSubmit = async (data: Partial<CarListingFormData>) => {
    try {
      submissionErrorRef.current = null;
      
      // First save progress without awaiting to ensure local data is saved
      saveProgress();
      
      // Then handle the submission
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

  const isLastStep = currentStep === formSteps.length - 1;

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
              setCurrentStep={handleStepChange}
              carId={carId}
              lastSaved={lastSaved}
              isOffline={isOffline}
              saveProgress={handleSaveProgress}
              formErrors={form.formState.errors}
              visibleSections={visibleSections}
              isSaving={isSaving}
            />
          </div>
          
          {isLastStep && (
            <div className="mt-8">
              <Button
                type="submit"
                className="bg-[#DC143C] hover:bg-[#DC143C]/90 text-white w-full md:w-auto float-right"
                disabled={isSubmitting || transactionStatus === TransactionStatus.PENDING}
              >
                {isSubmitting || transactionStatus === TransactionStatus.PENDING ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Listing'
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </FormDataProvider>
  );
};
