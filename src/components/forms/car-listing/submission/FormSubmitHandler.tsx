
/**
 * Form Submit Handler Component
 * Updated: 2025-06-13 - Updated to use JSON-based submission service instead of multipart
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { createCarListing } from "./services/submissionService";

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
  
  const { handleSubmit, formState } = formContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const auth = useAuth();
  const session = auth?.session;
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsSubmitting(true);
      
      console.log('Form submission started with JSON-based approach');
      
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
      
      console.log('Starting JSON-based submission with user:', currentUserId);
      
      // Use the JSON-based submission service
      const result = await createCarListing(formData, currentUserId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }
      
      const newCarId = result.id!;
      console.log('✓ Car listing created successfully with JSON approach:', newCarId);
      
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
        if (errorMessage.includes('Authentication failed')) {
          toast.error("Authentication Failed", {
            description: "Please log out and log back in, then try again.",
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
