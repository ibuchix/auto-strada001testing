
/**
 * Form Submit Handler Component
 * Created: 2025-05-12
 * Updated: 2025-05-13 - Added validation for required photos and enhanced error handling
 * Updated: 2025-05-14 - Fixed issues with photo field consolidation
 * Updated: 2025-05-15 - Improved error messages and validation logic
 * Updated: 2025-05-28 - Updated to use camelCase field names consistently
 * Updated: 2025-05-29 - Fixed imports and prop types
 * Updated: 2025-05-30 - Fixed import for router and loading spinner
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { validateRequiredPhotos } from "./utils/photoProcessor";
import { prepareFormDataForSubmission } from "./utils/submission";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { convertToBackendFields } from "@/utils/formFieldMapping";

export interface FormSubmitHandlerProps {
  onSuccess?: (data: any) => void;
  showAlerts?: boolean;
  userId?: string;
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
  carId?: string;
}

export const FormSubmitHandler: React.FC<FormSubmitHandlerProps> = ({ 
  onSuccess, 
  showAlerts = true,
  userId,
  onSubmitSuccess,
  onSubmitError,
  carId
}) => {
  const { handleSubmit, formState } = useFormContext<CarListingFormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsSubmitting(true);
      
      // Validate that all required photos have been uploaded
      const missingPhotoFields = validateRequiredPhotos(formData);
      
      if (missingPhotoFields.length > 0) {
        // Format field names for user-friendly display
        const formattedFields = missingPhotoFields.map(field => {
          // Convert snake_case to display format (e.g., "exterior_front" -> "Exterior Front")
          return field
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        });
        
        const errorMessage = `Missing required photos: ${formattedFields.join(', ')}`;
        
        if (showAlerts) {
          toast.error("Missing Required Photos", {
            description: errorMessage,
          });
        }
        
        // Update form validation status
        // We need to use the camelCase version of the field for the form
        setIsSubmitting(false);
        return false;
      }
      
      // Prepare form data for submission
      const preparedData = prepareFormDataForSubmission(formData);
      
      // Log the final data being submitted
      console.log("Submitting car listing:", preparedData);
      
      // In a real app, you would submit this data to your API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful submission
      if (showAlerts) {
        toast.success("Listing Submitted", {
          description: "Your car listing has been submitted successfully.",
        });
      }
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(preparedData);
      } else if (onSubmitSuccess) {
        // Call the onSubmitSuccess callback with the car ID
        onSubmitSuccess(carId || 'new-car-id');
      } else {
        // Default success behavior - redirect to seller dashboard
        navigate("/seller/dashboard");
      }
      
      return true;
    } catch (error) {
      console.error("Error submitting car listing:", error);
      
      if (showAlerts) {
        toast.error("Submission Failed", {
          description: "There was an error submitting your car listing. Please try again.",
        });
      }
      
      // Call the onSubmitError callback if provided
      if (onSubmitError && error instanceof Error) {
        onSubmitError(error);
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Button
      className="px-6"
      type="button"
      disabled={isSubmitting || formState.isSubmitting}
      onClick={handleSubmit(onSubmit)}
    >
      {isSubmitting || formState.isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        "Submit Listing"
      )}
    </Button>
  );
};
