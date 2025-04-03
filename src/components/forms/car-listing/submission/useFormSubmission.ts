
/**
 * Updated submission hook to use updated validation import
 */

import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { validateSubmission } from "./services/validationService";
import { submitCarListing } from "./services/submissionService";
import { ValidationError } from "./errors";
import { ValidationErrorCode } from "@/errors/types";

// Create a simple validation function to replace the missing import
const validateFormData = (data: CarListingFormData): string[] => {
  const errors: string[] = [];
  
  // Add basic validation checks
  if (!data.make) errors.push("Make is required");
  if (!data.model) errors.push("Model is required");
  if (!data.year) errors.push("Year is required");
  if (!data.mileage) errors.push("Mileage is required");
  
  return errors;
};

export const useFormSubmission = (userId: string) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: CarListingFormData, carId?: string) => {
    setIsSubmitting(true);
    
    try {
      // Validate the form data before submitting
      const clientSideErrors = validateFormData(data);
      
      if (clientSideErrors.length > 0) {
        console.error("Form validation errors:", clientSideErrors);
        toast.error("Please fix the following errors before submitting", {
          description: clientSideErrors.join(", ")
        });
        setIsSubmitting(false);
        return false;
      }
      
      // Add required fields
      data.seller_id = userId;
      
      // Perform server-side validation
      await validateSubmission(data, userId);
      
      // Submit the car listing
      const result = await submitCarListing(data, userId, carId);
      
      // Show success message
      toast.success("Car listing submitted successfully!");
      
      // Navigate to success page or dashboard
      navigate("/dashboard");
      
      return true;
    } catch (error) {
      console.error("Error submitting car listing:", error);
      
      if (error instanceof ValidationError) {
        switch (error.code) {
          case ValidationErrorCode.SCHEMA_VALIDATION_ERROR:
            toast.error("Form validation failed", { description: error.description });
            break;
          case ValidationErrorCode.INCOMPLETE_FORM:
            toast.error("Form incomplete", { description: error.description });
            break;
          case ValidationErrorCode.RATE_LIMIT_EXCEEDED:
            toast.error("Submission limit reached", { description: error.description });
            break;
          case ValidationErrorCode.SERVER_VALIDATION_FAILED:
            toast.error("Validation failed", { description: error.description });
            break;
          default:
            toast.error("An error occurred", { description: error.description });
        }
      } else {
        toast.error(
          "Failed to submit car listing", 
          { description: "Please try again later." }
        );
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { handleSubmit, isSubmitting };
};
