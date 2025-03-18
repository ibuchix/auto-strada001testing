
/**
 * Changes made:
 * - 2024-10-16: Integrated transaction confirmation system for form submissions
 * - 2024-10-17: Fixed syntax errors in the useFormSubmission hook
 * - 2024-10-18: Completely rewrote the file to fix structural and syntax errors
 * - 2024-10-22: Fixed syntax errors and type issues with toast custom rendering
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
import { useCreateTransaction } from "@/hooks/useTransaction";
import { TransactionNotification } from "@/components/transaction/TransactionNotification";
import { TransactionStatus } from "@/services/supabase/transactionService";

export const useFormSubmission = (userId?: string) => {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();
  const { 
    error, 
    setError, 
    handleSupabaseError
  } = useSupabaseErrorHandling({ 
    showToast: false // We'll handle toasts via transaction system
  });

  const { 
    execute: executeSubmission, 
    isLoading: submitting, 
    transactionStatus
  } = useCreateTransaction({
    showToast: false, // We'll handle custom notifications
    retryCount: 1,
    logToDb: true
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

    setError(null);

    try {
      // Validate mileage data first
      validateMileageData();
      
      // Validate form data
      const errors = validateFormData(data);
      if (errors.length > 0) {
        toast.error("Please complete all required fields", {
          description: "Some information is missing or incomplete."
        });
        return;
      }

      const uploadingToast = toast.loading("Uploading your listing...", {
        duration: Infinity
      });

      // Execute the submission within a transaction
      const result = await executeSubmission(
        "Submit Car Listing",
        async () => {
          return await submitCarListing(data, userId, carId);
        },
        {
          entityType: "car",
          entityId: carId,
          description: `Submitting listing for ${data.make} ${data.model}`,
          onSuccess: () => {
            toast.dismiss(uploadingToast);
            toast.custom(() => (
              <TransactionNotification
                title="Listing submitted successfully!"
                description="Your listing will be reviewed by our team."
                status={TransactionStatus.SUCCESS}
              />
            ));
            
            // Clean up storage after successful submission
            cleanupFormStorage();
            
            // Show success dialog
            setShowSuccessDialog(true);
          },
          onError: (error) => {
            toast.dismiss(uploadingToast);
            
            if ('message' in error && 'description' in error) {
              const submissionError = error as SubmissionErrorType;
              setError(submissionError.message);
              
              toast.custom(() => (
                <TransactionNotification
                  title={submissionError.message}
                  description={submissionError.description}
                  status={TransactionStatus.ERROR}
                />
              ));
            } else {
              handleSupabaseError(error, "Failed to submit listing");
            }
          }
        }
      );
      
      return result;
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // This will only execute if the executeTransaction wrapper itself fails
      // which is unlikely but possible
      if ('message' in error && 'description' in error) {
        const submissionError = error as SubmissionErrorType;
        setError(submissionError.message);
        
        toast.error(submissionError.message, {
          description: submissionError.description,
          duration: 5000,
          action: submissionError.action
        });
      } else {
        handleSupabaseError(error, "Failed to submit listing");
      }
      
      throw error;
    }
  };

  return {
    submitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit
  };
};
