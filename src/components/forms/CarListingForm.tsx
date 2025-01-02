import { Form } from "@/components/ui/form";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { useState } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { LastSaved } from "./car-listing/LastSaved";
import { FormSections } from "./car-listing/FormSections";
import { useFormSubmission } from "./car-listing/hooks/useFormSubmission";
import { toast } from "sonner";

export const CarListingForm = () => {
  const { session } = useAuth();
  const { form, carId, lastSaved } = useCarListingForm(session?.user.id);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { 
    submitting, 
    showSuccessDialog, 
    setShowSuccessDialog, 
    handleSubmit,
    navigate 
  } = useFormSubmission(session?.user.id);

  const onSubmit = async (data: any) => {
    console.log('Form onSubmit triggered with data:', data);
    
    // Basic validation
    if (!data.name || !data.address || !data.mobileNumber) {
      toast.error("Please fill in all required personal details");
      return;
    }

    if (!data.serviceHistoryType) {
      toast.error("Please select a service history type");
      return;
    }

    if (!data.seatMaterial || !data.numberOfKeys) {
      toast.error("Please fill in all required additional information");
      return;
    }

    if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
      toast.error("Please upload at least one photo");
      return;
    }

    await handleSubmit(data);
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