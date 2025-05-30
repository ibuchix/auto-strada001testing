
/**
 * Form Submit Handler Component
 * Updated: 2025-05-30 - Enhanced error handling and user feedback for direct INSERT approach
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createCarListingDirect } from "./services/directSubmissionService";

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
  const formContext = useFormContext<CarListingFormData>();
  
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
  const navigate = useNavigate();
  
  const auth = useAuth();
  const session = auth?.session;
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('Form submission started with data:', {
        hasRequiredPhotos: !!formData.requiredPhotos,
        requiredPhotosCount: formData.requiredPhotos ? Object.keys(formData.requiredPhotos).length : 0,
        hasAdditionalPhotos: !!formData.additionalPhotos,
        additionalPhotosCount: formData.additionalPhotos ? formData.additionalPhotos.length : 0,
        sellerName: formData.sellerName || formData.name,
        features: formData.features,
        reservePrice: formData.reservePrice
      });
      
      // Validate required data
      if (!formData.make || !formData.model || !formData.year) {
        const errorMessage = "Please fill in all required vehicle details (make, model, year)";
        console.error("Validation failed:", errorMessage);
        
        if (showAlerts) {
          toast.error("Missing Required Information", {
            description: errorMessage,
          });
        }
        
        setIsSubmitting(false);
        return false;
      }
      
      // Validate reserve price
      if (!formData.reservePrice || formData.reservePrice <= 0) {
        const errorMessage = "Reserve price must be greater than 0.";
        console.error("Validation failed:", errorMessage);
        
        if (showAlerts) {
          toast.error("Invalid Reserve Price", {
            description: errorMessage,
          });
        }
        
        setIsSubmitting(false);
        return false;
      }
      
      const currentUserId = userId || session?.user?.id;
      
      if (!currentUserId) {
        toast.error("Authentication Error", {
          description: "Please log in to submit a listing",
        });
        setIsSubmitting(false);
        return false;
      }
      
      console.log('Starting improved direct submission with user:', currentUserId);
      
      // Use the improved direct submission service
      const result = await createCarListingDirect(formData, currentUserId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }
      
      const newCarId = result.id!;
      console.log('✓ Car listing created successfully with improved method:', newCarId);
      
      // Success notification
      if (showAlerts) {
        toast.success("Listing Submitted Successfully", {
          description: "Your car listing has been created and is now available.",
        });
      }
      
      // Handle success callbacks
      if (onSuccess) {
        onSuccess(formData);
      } else if (onSubmitSuccess) {
        onSubmitSuccess(newCarId);
      } else {
        navigate("/dashboard/seller");
      }
      
      return true;
    } catch (error) {
      console.error("Error submitting car listing:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (showAlerts) {
        if (errorMessage.includes('not a verified seller')) {
          toast.error("Seller Verification Required", {
            description: "Your seller account needs to be verified. Please contact support.",
          });
        } else if (errorMessage.includes('Authentication failed') || errorMessage.includes('Session')) {
          toast.error("Authentication Failed", {
            description: "Please log out and log back in, then try again.",
          });
        } else if (errorMessage.includes('Direct INSERT failed')) {
          toast.error("Database Permission Error", {
            description: "There was a permission issue. Our team has been notified.",
          });
        } else {
          toast.error("Submission Failed", {
            description: "There was an error submitting your car listing. Please try again.",
          });
        }
      }
      
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
          Uploading & Submitting...
        </>
      ) : (
        "Submit Listing"
      )}
    </Button>
  );
};
