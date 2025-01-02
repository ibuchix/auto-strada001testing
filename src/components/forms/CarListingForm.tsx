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
    console.log('Form submission started with data:', data);
    
    if (!session?.user.id) {
      console.error('No user session found');
      toast.error("Please sign in to submit a listing");
      return;
    }

    // Basic validation with logging
    if (!data.name || !data.address || !data.mobileNumber) {
      console.error('Missing personal details:', { name: data.name, address: data.address, mobileNumber: data.mobileNumber });
      toast.error("Please fill in all required personal details");
      return;
    }

    if (!data.serviceHistoryType) {
      console.error('Missing service history type');
      toast.error("Please select a service history type");
      return;
    }

    if (!data.seatMaterial || !data.numberOfKeys) {
      console.error('Missing additional information:', { seatMaterial: data.seatMaterial, numberOfKeys: data.numberOfKeys });
      toast.error("Please fill in all required additional information");
      return;
    }

    if (!data.uploadedPhotos || data.uploadedPhotos.length === 0) {
      console.error('No photos uploaded');
      toast.error("Please upload at least one photo");
      return;
    }

    console.log('All validation passed, proceeding with submission');
    try {
      await handleSubmit(data);
      console.log('Form submitted successfully');
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error("Failed to submit listing. Please try again.");
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