import { Form } from "@/components/ui/form";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { useState } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { LastSaved } from "./car-listing/LastSaved";
import { FormSections } from "./car-listing/FormSections";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { handleFormSubmission } from "./car-listing/utils/submission";

export const CarListingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const draftId = location.state?.draftId;
  
  const { form, carId, lastSaved } = useCarListingForm(
    session?.user.id, 
    draftId || undefined // Ensure undefined is passed if draftId is null/empty
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const onSubmit = async (data: any) => {
    if (!session?.user.id) {
      toast.error("Please sign in to submit a listing");
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    try {
      const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');
      const result = await handleFormSubmission(
        data, 
        session.user.id, 
        valuationData, 
        carId || undefined // Ensure undefined is passed if carId is null/empty
      );

      if (result.success) {
        toast.success("Your listing has been submitted successfully!");
        setShowSuccessDialog(true);
      } else {
        toast.error(result.error || "Failed to submit listing");
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || "Failed to submit listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
        </form>
      </Form>

      <SuccessDialog 
        open={showSuccessDialog} 
        onOpenChange={setShowSuccessDialog}
        onClose={() => navigate('/dashboard/seller')}
      />
    </>
  );
};