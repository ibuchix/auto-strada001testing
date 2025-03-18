
/**
 * Changes made:
 * - 2024-06-07: Refactored from hooks/useFormSubmission.ts
 * - 2024-06-07: Simplified and focused on submission logic only
 * - 2024-06-12: Further refactored to use specialized utility files
 * - 2024-08-20: Integrated standardized error handling
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { validateMileageData } from "./utils/validationHandler";
import { cleanupFormStorage } from "./utils/storageCleanup";
import { submitCarListing } from "./services/submissionService";
import { validateFormData } from "../utils/validation";
import { SubmissionErrorType } from "./types";
import { useSupabaseErrorHandling } from "@/hooks/useSupabaseErrorHandling";

export const useFormSubmission = (userId?: string) => {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();
  const { 
    error, 
    setError, 
    isLoading: submitting, 
    setIsLoading: setSubmitting,
    handleSupabaseError
  } = useSupabaseErrorHandling({ 
    showToast: false // We'll handle toasts manually for form submission
  });

  const handleSubmit = async (data: CarListingFormData, carId?: string) => {
    if (!userId) {
      toast.error("Please sign in to submit a listing", {
        description: "You'll be redirected to the login page.",
        duration: 5000,
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth")
        }
      });
      navigate("/auth");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Validate mileage data first
      validateMileageData();
      
      // Validate form data
      const errors = validateFormData(data);
      if (errors.length > 0) {
        toast.error("Please complete all required fields", {
          description: "Some information is missing or incomplete.",
        });
        setSubmitting(false);
        return;
      }

      const uploadingToast = toast.loading("Uploading your listing...", {
        duration: Infinity,
      });

      // Submit the data
      await submitCarListing(data, userId, carId);

      toast.dismiss(uploadingToast);

      toast.success("Listing submitted successfully!", {
        description: "Your listing will be reviewed by our team.",
      });
      
      // Clean up storage after successful submission
      cleanupFormStorage();
      
      // Show success dialog
      setShowSuccessDialog(true);
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Handle submission error type
      if ('message' in error && 'description' in error) {
        const submissionError = error as SubmissionErrorType;
        setError(submissionError.message);
        
        toast.error(submissionError.message, {
          description: submissionError.description,
          duration: 5000,
          action: submissionError.action
        });
      } else {
        // Use our standardized error handling
        handleSupabaseError(error, "Failed to submit listing");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    error,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit
  };
};
