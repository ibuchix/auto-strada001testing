
/**
 * Secure Form Submit Handler Component
 * Created: 2025-05-30 - Enhanced security for form submissions
 * Updated: 2025-06-14 - Fixed import to use correct submission service
 */

import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { useNavigate } from "react-router-dom";
import { Loader2, Shield } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { validateCarListingData, checkRateLimit } from "@/services/securityValidationService";
import { createCarListing } from "./services/submissionService";

export interface SecureFormSubmitHandlerProps {
  onSuccess?: (data: any) => void;
  showAlerts?: boolean;
  userId?: string;
  onSubmitSuccess?: (carId: string) => void;
  onSubmitError?: (error: Error) => void;
}

export const SecureFormSubmitHandler: React.FC<SecureFormSubmitHandlerProps> = ({ 
  onSuccess, 
  showAlerts = true,
  userId,
  onSubmitSuccess,
  onSubmitError
}) => {
  const formContext = useFormContext<CarListingFormData>();
  
  if (!formContext) {
    console.error("SecureFormSubmitHandler must be used within a FormProvider");
    return (
      <Button className="px-6" type="button" disabled>
        <Shield className="mr-2 h-4 w-4" />
        Submit Listing
      </Button>
    );
  }
  
  const { handleSubmit, formState } = formContext;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  
  const auth = useAuth();
  const session = auth?.session;
  
  const onSubmit = async (formData: CarListingFormData) => {
    try {
      setIsValidating(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting secure form submission with enhanced validation');
      }
      
      const currentUserId = userId || session?.user?.id;
      
      if (!currentUserId) {
        toast.error("Authentication Required", {
          description: "Please log in to submit a listing",
        });
        return false;
      }
      
      // Check rate limiting
      const rateLimitOk = await checkRateLimit('car-listing-submission', 10, 60);
      if (!rateLimitOk) {
        toast.error("Rate Limit Exceeded", {
          description: "Too many submissions in the last hour. Please try again later.",
        });
        return false;
      }
      
      // Comprehensive server-side validation
      const validationResult = await validateCarListingData(formData);
      if (!validationResult.isValid) {
        console.error("Validation failed:", validationResult.errors);
        
        if (showAlerts) {
          toast.error("Validation Failed", {
            description: validationResult.errors.join(", "),
          });
        }
        
        return false;
      }
      
      setIsValidating(false);
      setIsSubmitting(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Validation passed, submitting with sanitized data');
      }
      
      // Use sanitized data for submission
      const sanitizedFormData = {
        ...formData,
        ...validationResult.sanitizedData
      };
      
      // Submit using the correct JSON-based submission service
      const result = await createCarListing(sanitizedFormData, currentUserId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }
      
      const newCarId = result.id!;
      if (process.env.NODE_ENV === 'development') {
        console.log('✓ Secure car listing created successfully:', newCarId);
      }
      
      // Success notification
      if (showAlerts) {
        toast.success("Listing Submitted Successfully", {
          description: "Your car listing has been securely created and is now available.",
        });
      }
      
      // Handle success callbacks
      if (onSuccess) {
        onSuccess(sanitizedFormData);
      } else if (onSubmitSuccess) {
        onSubmitSuccess(newCarId);
      } else {
        navigate("/dashboard/seller");
      }
      
      return true;
      
    } catch (error) {
      console.error("Error in secure form submission:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (showAlerts) {
        if (errorMessage.includes('Authentication')) {
          toast.error("Authentication Failed", {
            description: "Please log out and log back in, then try again.",
          });
        } else if (errorMessage.includes('Rate limit')) {
          toast.error("Too Many Requests", {
            description: "Please wait before submitting another listing.",
          });
        } else if (errorMessage.includes('Validation')) {
          toast.error("Invalid Data", {
            description: "Please check your form data and try again.",
          });
        } else {
          toast.error("Submission Failed", {
            description: "There was an error submitting your listing. Please try again.",
          });
        }
      }
      
      if (onSubmitError && error instanceof Error) {
        onSubmitError(error);
      }
      
      return false;
      
    } finally {
      setIsValidating(false);
      setIsSubmitting(false);
    }
  };
  
  const isProcessing = isValidating || isSubmitting || formState.isSubmitting;
  
  return (
    <Button
      className="px-6"
      type="button"
      disabled={isProcessing}
      onClick={handleSubmit(onSubmit)}
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isValidating ? "Validating..." : "Submitting..."}
        </>
      ) : (
        <>
          <Shield className="mr-2 h-4 w-4" />
          Submit Listing
        </>
      )}
    </Button>
  );
};
