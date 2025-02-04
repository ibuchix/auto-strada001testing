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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

    // Only proceed with submission if we have a carId or it's a new submission
    await handleSubmit(data, carId);
  };

  useEffect(() => {
    if (location.state?.fromValuation) {
      toast.success("Vehicle information pre-filled", {
        description: "Please complete the remaining details to submit your listing.",
        duration: 5000
      });
    }

    // Check for required data
    const valuationData = localStorage.getItem('valuationData');
    if (!valuationData) {
      toast.error("Missing vehicle information", {
        description: "Please complete the vehicle valuation first.",
        action: {
          label: "Start Valuation",
          onClick: () => navigate('/sellers')
        }
      });
      navigate('/sellers');
    }
  }, [location.state, navigate]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full max-w-4xl mx-auto px-4 md:px-6">
          {!session && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to create a listing. Your progress will be saved.
              </AlertDescription>
            </Alert>
          )}
          
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