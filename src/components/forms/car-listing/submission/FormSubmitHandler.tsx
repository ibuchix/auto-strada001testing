
/**
 * Form Submit Handler Component
 * Created: 2025-05-12
 * Updated: 2025-05-13 - Added validation for required photos and enhanced error handling
 * Updated: 2025-05-14 - Fixed issues with photo field consolidation
 * Updated: 2025-05-15 - Improved error messages and validation logic
 * Updated: 2025-05-28 - Updated to use camelCase field names consistently
 * Updated: 2025-05-29 - Fixed imports and prop types
 * Updated: 2025-05-30 - Fixed import for router and loading spinner
 * Updated: 2025-05-31 - Fixed imports and resolved build errors
 * Updated: 2025-06-20 - Fixed destructuring syntax error and added null checks
 * Updated: 2025-06-24 - Improved photo field validation using standardizePhotoCategory
 * Updated: 2025-06-24 - Enhanced error messages with better field name formatting
 * Updated: 2025-06-25 - Added more detailed validation logs and improved error messaging
 * Updated: 2025-05-20 - Fixed FormProvider context usage with better error handling
 * Updated: 2025-05-20 - Added image association functionality after form submission
 * Updated: 2025-05-20 - Fixed car submission to use actual database and proper image association
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { validateRequiredPhotos } from "./utils/photoValidator";
import { prepareFormDataForSubmission } from "./utils/submission";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { standardizePhotoCategory, PHOTO_FIELD_MAP } from "@/utils/photoMapping";
import { useImageAssociation } from "@/hooks/submission/useImageAssociation";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/components/AuthProvider";
import { submitCarListing } from "./services/submissionService";

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
  // Get form context from React Hook Form's useFormContext
  const formContext = useFormContext<CarListingFormData>();
  
  // Add null check and better error handling for formContext
  if (!formContext) {
    console.error("FormSubmitHandler must be used within a FormProvider");
    return (
      <Button className="px-6" type="button" disabled>
        Submit Listing
      </Button>
    );
  }
  
  const { handleSubmit, formState, getValues } = formContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAssociatingImages, setIsAssociatingImages] = useState(false);
  const navigate = useNavigate();
  
  // Use the image association hook
  const { associateImages, isAssociating } = useImageAssociation();
  
  // Get auth context
  const auth = useAuth();
  const session = auth?.session;
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsSubmitting(true);
      
      // Generate a unique submission ID for tracking
      const submissionId = uuidv4().slice(0, 8);
      console.log(`[FormSubmission][${submissionId}] Starting form submission...`);
      
      console.log("Starting form submission validation...");
      console.log("Form data for validation:", {
        photoValidationPassed: formData.photoValidationPassed,
        hasRequiredPhotos: !!formData.requiredPhotos,
        requiredPhotosKeys: formData.requiredPhotos ? Object.keys(formData.requiredPhotos) : [],
        hasVehiclePhotos: !!formData.vehiclePhotos,
        vehiclePhotoKeys: formData.vehiclePhotos ? Object.keys(formData.vehiclePhotos) : []
      });
      
      // Validate that all required photos have been uploaded
      const missingPhotoFields = validateRequiredPhotos(formData);
      
      if (missingPhotoFields.length > 0) {
        // Format field names for user-friendly display
        const formattedFields = missingPhotoFields.map(field => {
          // Try to find a camelCase equivalent for better display
          const camelKey = Object.entries(PHOTO_FIELD_MAP).find(([_, v]) => v === field)?.[0];
          const displayName = camelKey || field;
          
          // Convert to display format (e.g., "exterior_front" -> "Exterior Front")
          return displayName
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/\s(.)/g, (_, c) => ' ' + c.toUpperCase())
            .trim();
        });
        
        const errorMessage = `Missing required photos: ${formattedFields.join(', ')}`;
        console.error("Validation failed:", errorMessage);
        
        if (showAlerts) {
          toast.error("Missing Required Photos", {
            description: errorMessage,
          });
        }
        
        // Update form validation status
        setIsSubmitting(false);
        return false;
      }
      
      // Prepare form data for submission
      const preparedData = prepareFormDataForSubmission(formData);
      
      // Get the current user ID from props or auth context
      const currentUserId = userId || session?.user?.id;
      
      if (!currentUserId) {
        toast.error("Authentication Error", {
          description: "Please log in to submit a listing",
        });
        setIsSubmitting(false);
        return false;
      }
      
      // Log the final data being submitted
      console.log(`[FormSubmission][${submissionId}] Submitting car listing:`, preparedData);
      
      // Submit the data to the database
      let result;
      try {
        result = await submitCarListing(preparedData, currentUserId);
        console.log(`[FormSubmission][${submissionId}] Form submitted successfully, car ID: ${result.id}`);
      } catch (error) {
        console.error(`[FormSubmission][${submissionId}] Error submitting to database:`, error);
        toast.error("Submission Failed", {
          description: "There was an error saving your listing to the database. Please try again.",
        });
        if (onSubmitError && error instanceof Error) {
          onSubmitError(error);
        }
        setIsSubmitting(false);
        return false;
      }
      
      const newCarId = result.id;
      
      // Associate images with the new car ID
      setIsAssociatingImages(true);
      try {
        console.log(`[FormSubmission][${submissionId}] Associating images with car ID: ${newCarId}`);
        const associatedCount = await associateImages(newCarId, submissionId);
        console.log(`[FormSubmission][${submissionId}] Successfully associated ${associatedCount} images`);
      } catch (imageError) {
        console.error(`[FormSubmission][${submissionId}] Error associating images:`, imageError);
        // Don't fail the submission if image association fails
        toast.error("Warning: Some images may not have been properly associated with your listing", {
          description: "Your listing has been submitted, but there was an issue with the images."
        });
      } finally {
        setIsAssociatingImages(false);
      }
      
      // Show success toast
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
        onSubmitSuccess(newCarId);
      } else {
        // Default success behavior - redirect to seller dashboard
        navigate("/dashboard/seller");
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
      disabled={isSubmitting || isAssociatingImages || formState.isSubmitting}
      onClick={handleSubmit(onSubmit)}
    >
      {isSubmitting || isAssociatingImages || formState.isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isAssociatingImages ? "Associating Images..." : "Submitting..."}
        </>
      ) : (
        "Submit Listing"
      )}
    </Button>
  );
};
