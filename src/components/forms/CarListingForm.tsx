import { Form } from "@/components/ui/form";
import { useAuth } from "@/components/AuthProvider";
import { useCarListingForm } from "./car-listing/hooks/useCarListingForm";
import { useState } from "react";
import { FormSubmitButton } from "./car-listing/FormSubmitButton";
import { SuccessDialog } from "./car-listing/SuccessDialog";
import { LastSaved } from "./car-listing/LastSaved";
import { FormSections } from "./car-listing/FormSections";
import { useFormSubmission } from "./car-listing/hooks/useFormSubmission";

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

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
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