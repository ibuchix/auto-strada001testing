
/**
 * Form Content Component
 * - Manages the entire form state and initialization
 * - Updated: 2025-06-09: Enhanced valuation data initialization to ensure reserve price is set
 * - Fixed: 2025-06-10: Resolved import errors and typing issues
 * - Fixed: 2025-06-11: Fixed FormNavigationControls import path
 * - Fixed: 2025-06-12: Implemented FormDataProvider to resolve context errors
 * - Enhanced: 2025-06-14: Improved reserve price data loading from valuation
 * - Updated: 2025-05-02: Removed auto-save in favor of manual save button and final submission
 * - Added: 2025-05-02: Session timeout warning and temporary file storage
 */

import { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarListingFormData } from "@/types/forms";
import { FormContainer } from "./components/FormContainer";
import { FormNavigationControls } from "./FormNavigationControls"; 
import { useStepNavigation } from "./hooks/useStepNavigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, WarningTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import * as z from "zod";
import { FormDataProvider } from "./context/FormDataContext";
import { tempFileStorage } from "@/services/temp-storage/tempFileStorageService";

// Create a simple schema for form validation based on CarListingFormData
const carListingFormSchema = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  mileage: z.number().optional(),
  vin: z.string().optional(),
  transmission: z.enum(["manual", "automatic", "semi-automatic"]).optional(),
  isSellingOnBehalf: z.boolean().default(false),
  hasServiceHistory: z.boolean().default(false),
  hasPrivatePlate: z.boolean().default(false),
  hasFinance: z.boolean().default(false),
  isDamaged: z.boolean().default(false),
  reserve_price: z.number().optional(),
});

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
  
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState(60); // 60 minutes initially
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  
  // Update session time remaining
  useEffect(() => {
    const updateSessionTime = () => {
      const remaining = tempFileStorage.getRemainingSessionTime();
      setSessionTimeRemaining(remaining);
      
      // Show warning when less than 10 minutes remaining
      if (remaining <= 10 && remaining > 0) {
        setShowTimeWarning(true);
      }
      
      // If time is up, show critical warning
      if (remaining <= 0) {
        toast.error("Your session has expired", {
          description: "Please save your progress and start a new session."
        });
      }
    };
    
    updateSessionTime();
    const interval = setInterval(updateSessionTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Save form data to localStorage (not database)
  const saveFormToLocal = () => {
    try {
      const formData = form.getValues();
      localStorage.setItem('car_form_data', JSON.stringify(formData));
      toast.success("Form progress saved locally", {
        description: "Your progress has been saved to your device."
      });
      return true;
    } catch (error) {
      console.error("Error saving form locally:", error);
      toast.error("Failed to save progress", {
        description: "Please try again or continue without saving."
      });
      return false;
    }
  };
  
  // Load form data from localStorage
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('car_form_data');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      }
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  }, [form]);
  
  return (
    <FormProvider {...form}>
      {/* Session timeout warning */}
      {showTimeWarning && (
        <Alert variant="destructive" className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your session will expire in {sessionTimeRemaining} minutes. Please complete and submit the form before it expires.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={saveFormToLocal}
            >
              Save Progress
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Form introduction alert */}
      <Alert className="mb-6">
        <WarningTriangle className="h-4 w-4" />
        <AlertDescription>
          Please complete this form in one sitting. You have 1 hour to complete and submit the form.
          All files and information will be uploaded when you submit the form at the end.
        </AlertDescription>
      </Alert>
      
      <FormDataProvider form={form}>
        <div className="space-y-8">
          {/* Form container displays the current step */}
          <FormContainer 
            currentStep={currentStep}
            onNext={goToNextStep}
            onPrevious={goToPrevStep}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === totalSteps - 1}
            navigationDisabled={false}
            isSaving={false}
            carId={draftId}
            userId={session.user.id}
          />
          
          {/* Navigation controls */}
          <FormNavigationControls
            currentStep={currentStep}
            totalSteps={totalSteps}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === totalSteps - 1}
            onPrevious={goToPrevStep}
            onNext={goToNextStep}
            navigationDisabled={false}
            isSaving={false}
            isNavigating={false}
            onSave={saveFormToLocal}
            carId={draftId}
          />
        </div>
      </FormDataProvider>
    </FormProvider>
  );
};
