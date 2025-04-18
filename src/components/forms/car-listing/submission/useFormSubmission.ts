
/**
 * Updated submission hook with proper type returns for FormSubmissionProvider
 * - 2025-04-03: Added missing properties for FormSubmissionContextType
 * - 2025-04-03: Fixed TransactionStatus enum usage to use proper type
 * - 2025-04-06: Fixed error code type comparisons
 */

import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { CarListingFormData } from "@/types/forms";
import { validateSubmission } from "./services/validationService";
import { submitCarListing } from "./services/submissionService";
import { ValidationError } from "./errors";
import { ErrorCode } from "@/errors/types";
import { TransactionStatus } from "@/services/supabase/transactions/types";

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
  const [error, setError] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  
  const resetTransaction = () => {
    setError(null);
    setTransactionStatus(null);
  };
  
  const handleSubmit = async (data: CarListingFormData, carId?: string): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    setTransactionStatus(TransactionStatus.PENDING);
    
    try {
      // Validate the form data before submitting
      const clientSideErrors = validateFormData(data);
      
      if (clientSideErrors.length > 0) {
        console.error("Form validation errors:", clientSideErrors);
        toast.error("Please fix the following errors before submitting", {
          description: clientSideErrors.join(", ")
        });
        setIsSubmitting(false);
        setError("Validation failed");
        setTransactionStatus(TransactionStatus.ERROR);
        return;
      }
      
      // Add required fields
      data.seller_id = userId;
      
      // Perform server-side validation
      await validateSubmission(data, userId);
      
      // Submit the car listing
      const result = await submitCarListing(data, userId, carId);
      
      // Show success message
      toast.success("Car listing submitted successfully!");
      setTransactionStatus(TransactionStatus.SUCCESS);
      
      // Navigate to success page or dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting car listing:", error);
      setTransactionStatus(TransactionStatus.ERROR);
      
      if (error instanceof ValidationError) {
        setError(error.message);
        
        // Use direct comparisons with ErrorCode enum for proper TypeScript checking
        switch (error.code) {
          case ErrorCode.SCHEMA_VALIDATION_ERROR:
            toast.error("Form validation failed", { description: error.description });
            break;
          case ErrorCode.INCOMPLETE_FORM:
            toast.error("Form incomplete", { description: error.description });
            break;
          case ErrorCode.RATE_LIMIT_EXCEEDED:
            toast.error("Submission limit reached", { description: error.description });
            break;
          case ErrorCode.SERVER_VALIDATION_FAILED:
            toast.error("Validation failed", { description: error.description });
            break;
          default:
            toast.error("An error occurred", { description: error.description });
        }
      } else {
        setError("Unknown error");
        toast.error(
          "Failed to submit car listing", 
          { description: "Please try again later." }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { 
    handleSubmit, 
    isSubmitting, 
    error, 
    transactionStatus,
    showSuccessDialog, 
    setShowSuccessDialog,
    resetTransaction 
  };
};
