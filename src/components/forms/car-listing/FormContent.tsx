
/**
 * Changes made:
 * - 2024-09-05: Extracted from CarListingForm.tsx to separate component
 */

import { Form } from "@/components/ui/form";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";

import { useCarListingForm } from "./hooks/useCarListingForm";
import { FormSections } from "./FormSections";
import { LastSaved } from "./LastSaved";
import { FormProgress } from "./FormProgress";
import { RequirementsDisplay } from "./RequirementsDisplay";
import { MultiStepFormControls } from "./MultiStepFormControls";
import { SuccessDialog } from "./SuccessDialog";
import { ProgressPreservation } from "./submission/ProgressPreservation";
import { useFormSubmissionContext } from "./submission/FormSubmissionProvider";
import { validateFormData, getFormProgress } from "./utils/validation";
import { formSteps } from "./constants/formSteps";

interface FormContentProps {
  session: any;
  draftId?: string;
}

export const FormContent = ({ session, draftId }: FormContentProps) => {
  const { form, carId, lastSaved } = useCarListingForm(
    session?.user.id, 
    draftId
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOffline, setIsOffline] = useState(false);
  const [formLastSaved, setFormLastSaved] = useState<Date | null>(lastSaved);
  const { submitting, showSuccessDialog, setShowSuccessDialog, handleSubmit } = useFormSubmissionContext();
  const navigate = useNavigate();

  // Update progress and validation on form changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      setFormProgress(getFormProgress(data));
      setValidationErrors(validateFormData(data));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Load saved step from localStorage if available
  useEffect(() => {
    const savedStep = localStorage.getItem('formCurrentStep');
    if (savedStep) {
      const step = parseInt(savedStep, 10);
      if (!isNaN(step) && step >= 0 && step < formSteps.length) {
        setCurrentStep(step);
      }
    }
  }, []);

  const nextStep = () => {
    if (currentStep < formSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < formSteps.length) {
      setCurrentStep(step);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data: any) => {
    const storedMileage = localStorage.getItem('tempMileage');
    if (!storedMileage) {
      toast.error("Missing vehicle information", {
        description: "Please complete the vehicle valuation first. You'll be redirected to start the process.",
        action: {
          label: "Start Valuation",
          onClick: () => navigate('/sellers')
        }
      });
      navigate('/sellers');
      return;
    }

    const errors = validateFormData(data);
    if (errors.length > 0) {
      toast.error("Please complete all required fields", {
        description: "Some information is missing or incomplete.",
      });
      return;
    }

    if (isOffline) {
      toast.error("You are offline", {
        description: "Please reconnect to the internet to submit your listing.",
        duration: 5000
      });
      return;
    }

    await handleSubmit(data, carId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <LastSaved timestamp={formLastSaved} />
          {isOffline && (
            <div className="flex items-center text-amber-500 gap-2">
              <WifiOff size={16} />
              <span className="text-sm">Offline mode</span>
            </div>
          )}
          {!isOffline && formLastSaved && (
            <div className="flex items-center text-green-500 gap-2">
              <Wifi size={16} />
              <span className="text-sm">Changes saved</span>
            </div>
          )}
        </div>
        
        <div className="sticky top-0 bg-white z-10 pt-4 pb-2 border-b">
          <FormProgress 
            progress={formProgress} 
            steps={formSteps}
            currentStep={currentStep}
            onStepClick={goToStep}
          />
        </div>
        
        {validationErrors.length > 0 && (
          <RequirementsDisplay errors={validationErrors} />
        )}
        
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {formSteps[currentStep].title}
          </h2>
          
          <div className="space-y-6">
            <FormSections
              form={form}
              carId={carId}
              uploadProgress={uploadProgress}
              onProgressUpdate={setUploadProgress}
              currentStep={currentStep}
            />
          </div>
        </Card>

        <MultiStepFormControls 
          currentStep={currentStep} 
          totalSteps={formSteps.length}
          onNext={nextStep}
          onPrevious={prevStep}
          isSubmitting={submitting}
          isLastStep={currentStep === formSteps.length - 1}
          onSubmit={form.handleSubmit(onSubmit)}
          isOffline={isOffline}
        />
        
        <ProgressPreservation 
          currentStep={currentStep} 
          onLastSavedChange={setFormLastSaved}
          onOfflineStatusChange={setIsOffline}
        />
      </form>

      <SuccessDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog}
        onClose={() => navigate('/dashboard/seller')}
      />
    </Form>
  );
};
