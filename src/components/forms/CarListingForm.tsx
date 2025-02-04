import { Form } from "@/components/ui/form";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { useState, useEffect } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { LastSaved } from "./car-listing/LastSaved";
import { FormSections } from "./car-listing/FormSections";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useFormSubmission } from "./car-listing/hooks/useFormSubmission";

export const CarListingForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const draftId = location.state?.draftId;
  
  const { form, carId, lastSaved } = useCarListingForm(
    session?.user.id, 
    draftId || undefined
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const { submitting, showSuccessDialog, setShowSuccessDialog, handleSubmit } = useFormSubmission(session?.user.id);

  const onSubmit = async (data: any) => {
    const storedMileage = localStorage.getItem('tempMileage');
    if (!storedMileage) {
      toast.error("Please complete the vehicle valuation first");
      navigate('/sellers');
      return;
    }

    // Only proceed with submission if we have a carId or it's a new submission
    await handleSubmit(data, carId);
  };

  useEffect(() => {
    if (location.state?.fromValuation) {
      toast.success("Vehicle information has been pre-filled. Please complete the remaining details.");
    }
  }, [location.state]);

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