
/**
 * Changes made:
 * - 2024-10-16: Integrated transaction confirmation system for form submissions
 * - 2024-10-17: Fixed syntax errors in the useFormSubmission hook
 * - 2024-10-18: Completely rewrote the file to fix structural and syntax errors
 * - 2024-10-22: Fixed syntax errors and type issues with toast custom rendering
 * - 2024-10-23: Corrected issues with JSX in toast.custom and code structure
 * - 2024-10-24: Fixed transaction system type errors
 * - 2024-10-25: Removed JSX in .ts file and fixed transaction options
 * - 2024-07-24: Enhanced valuation data validation and error handling
 * - 2024-07-28: Added debug utilities to help diagnose mileage issues
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CarListingFormData } from "@/types/forms";
import { validateMileageData, validateValuationData } from "./utils/validationHandler";
import { cleanupFormStorage } from "./utils/storageCleanup";
import { submitCarListing } from "./services/submissionService";
import { validateFormData } from "../utils/validation";
import { SubmissionErrorType } from "./types";
import { useSupabaseErrorHandling } from "@/hooks/useSupabaseErrorHandling";
import { useCreateTransaction } from "@/hooks/useTransaction";
import { TransactionOptions } from "@/services/supabase/transactionService";
import { debugMileageData, logAllLocalStorage } from "../utils/debugUtils";

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
    console.log('Form submission handler triggered');
    console.log('Debugging mileage data before submission:');
    debugMileageData();
    console.log('All localStorage items:');
    logAllLocalStorage();
    
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
      // Try to validate valuation data first to check if it exists
      try {
        console.log('Pre-validating valuation data');
        const valuationData = validateValuationData();
        console.log('Valuation data pre-validation successful:', valuationData);
      } catch (validationError: any) {
        console.error('Valuation data pre-validation failed:', validationError);
        toast.error(validationError.message || "Missing valuation data", {
          description: validationError.description || "Please complete the vehicle valuation first",
          duration: 5000,
          action: validationError.action || {
            label: "Start Valuation",
            onClick: () => navigate("/sellers")
          }
        });
        return;
      }
      
      // Validate mileage data
      try {
        console.log('Validating mileage data');
        validateMileageData();
        console.log('Mileage validation successful');
      } catch (mileageError: any) {
        console.error('Mileage validation failed:', mileageError);
        toast.error(mileageError.message || "Missing mileage data", {
          description: mileageError.description || "Please complete the vehicle valuation first",
          duration: 5000,
          action: mileageError.action || {
            label: "Start Valuation",
            onClick: () => navigate("/sellers")
          }
        });
        return;
      }
      
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
          description: `Submitting listing for ${data.make} ${data.model}`,
          metadata: {
            carId,
            make: data.make,
            model: data.model
          },
          onSuccess: () => {
            toast.dismiss(uploadingToast);
            
            // Using a function to render component for toast
            // Instead of JSX, we'll use a more compatible approach in .ts file
            toast.success("Listing submitted successfully!", {
              description: "Your listing will be reviewed by our team."
            });
            
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
              
              // Using error toast instead of custom component
              toast.error(submissionError.message, {
                description: submissionError.description
              });
            } else {
              handleSupabaseError(error, "Failed to submit listing");
            }
          }
        } as TransactionOptions
      );
      
      return result;
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // This will only execute if the executeTransaction wrapper itself fails
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
