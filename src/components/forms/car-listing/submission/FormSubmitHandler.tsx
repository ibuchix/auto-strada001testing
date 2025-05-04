
/**
 * Form Submit Handler Component
 * Created: 2025-05-13
 * Updated: 2025-05-16 - Enhanced error handling and improved UX feedback
 * 
 * Provides form submission handler with proper null safety for userId
 */

import { useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { useFormSubmission } from "./FormSubmissionProvider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FormSubmitHandlerProps {
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
  carId?: string;
  userId?: string;
}

export const FormSubmitHandler = ({
  onSubmitSuccess,
  onSubmitError,
  carId,
  userId
}: FormSubmitHandlerProps) => {
  const { submissionState, submitForm, resetSubmissionState } = useFormSubmission();
  const { form } = useFormData();
  
  // Check if we have valid userId before allowing submission
  const isSubmitDisabled = !userId || submissionState.isSubmitting;
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!userId) {
      toast.error("Cannot submit form", {
        description: "User ID is not available. Please try refreshing the page."
      });
      return;
    }
    
    try {
      const values = form.getValues();
      
      // Validate required fields before submitting
      const requiredFields = ['make', 'model', 'year', 'mileage', 'vin'];
      const missingFields = requiredFields.filter(field => !values[field]);
      
      if (missingFields.length > 0) {
        toast.error("Missing required information", {
          description: `Please fill in: ${missingFields.join(', ')}`
        });
        return;
      }
      
      // Submit the form
      const result = await submitForm(values);
      
      if (result && onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      if (onSubmitError && error instanceof Error) {
        onSubmitError(error);
      }
    }
  };
  
  // Reset submission state when component unmounts
  useEffect(() => {
    return () => {
      resetSubmissionState();
    };
  }, [resetSubmissionState]);
  
  return (
    <div className="flex flex-col gap-4">
      {submissionState.error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <p>Error: {submissionState.error.message}</p>
        </div>
      )}
      
      <Button 
        type="button" 
        onClick={handleSubmit} 
        disabled={isSubmitDisabled}
        className={`${submissionState.isSubmitting ? "opacity-70" : ""} bg-[#DC143C] hover:bg-[#DC143C]/90`}
      >
        {submissionState.isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : "Submit Listing"}
      </Button>
      
      {submissionState.isSuccessful && (
        <div className="bg-green-50 text-green-800 p-4 rounded-md">
          <p>Car listing submitted successfully!</p>
        </div>
      )}
    </div>
  );
};
