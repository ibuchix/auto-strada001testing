import { Form } from "@/components/ui/form";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { useState } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { LastSaved } from "./car-listing/LastSaved";
import { FormSections } from "./car-listing/FormSections";
import { useNavigate, useLocation } from "react-router-dom";
import { FormSubmissionProvider } from "./car-listing/submission/FormSubmissionProvider";
import { ErrorHandler } from "./car-listing/submission/ErrorHandler";
import { ProgressPreservation } from "./car-listing/submission/ProgressPreservation";
import { useFormSubmissionContext } from "./car-listing/submission/FormSubmissionProvider";

const FormContent = () => {
  const { form, carId, lastSaved } = useCarListingForm(
    session?.user.id, 
    draftId || undefined
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const { submitting, showSuccessDialog, setShowSuccessDialog, handleSubmit } = useFormSubmissionContext();
  const navigate = useNavigate();
  const location = useLocation();

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

    await handleSubmit(data, carId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
        <LastSaved timestamp={lastSaved ? new Date(lastSaved) : null} />
        
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
      <FormContent />
    </FormSubmissionProvider>
  );
};