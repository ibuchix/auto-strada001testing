import { Form } from "@/components/ui/form";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { useState, useEffect } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { LastSaved } from "./car-listing/LastSaved";
import { FormSections } from "./car-listing/FormSections";
import { useNavigate, useLocation } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { ErrorHandler } from "./car-listing/submission/ErrorHandler";
import { ProgressPreservation } from "./car-listing/submission/ProgressPreservation";
import { useFormSubmissionContext } from "./car-listing/submission/FormSubmissionProvider";
import { toast } from "sonner";
import { FormProgress } from "./car-listing/FormProgress";
import { RequirementsDisplay } from "./car-listing/RequirementsDisplay";
import { validateFormData, getFormProgress } from "./car-listing/utils/validation";

const FormContent = ({ session, draftId }: { session: any; draftId?: string }) => {
  const { form, carId, lastSaved } = useCarListingForm(
    session?.user.id, 
    draftId
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
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

    await handleSubmit(data, carId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
        <LastSaved timestamp={lastSaved ? new Date(lastSaved) : null} />
        
        <FormProgress progress={formProgress} />
        <RequirementsDisplay errors={validationErrors} />
        
        <FormSections
          form={form}
          carId={carId}
          uploadProgress={uploadProgress}
          onProgressUpdate={setUploadProgress}
        />

        <FormSubmitButton isSubmitting={submitting} />
        <ProgressPreservation />
      </form>

      <SuccessDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog}
        onClose={() => navigate('/dashboard/seller')}
      />
    </Form>
  );
};

export const CarListingForm = () => {
  const { session } = useAuth();
  const location = useLocation();
  const draftId = location.state?.draftId;

  if (!session) {
    return (
      <ErrorHandler 
        error="Please sign in to create a listing. Your progress will be saved."
      />
    );
  }

  return (
    <FormSubmissionProvider userId={session.user.id}>
      <FormContent session={session} draftId={draftId} />
    </FormSubmissionProvider>
  );
};