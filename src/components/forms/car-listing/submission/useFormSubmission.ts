
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
 * - 2024-07-30: Added transaction reset and improved error handling
 * - 2025-06-15: Removed diagnostic code
 */

import { useState, useEffect } from "react";
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
import { TransactionOptions, TRANSACTION_STATUS } from "@/services/supabase/transactionService";

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
    transactionStatus,
    reset: resetTransaction
  } = useCreateTransaction({
    showToast: false, // We'll handle custom notifications
    retryCount: 1,
    logToDb: true
  });

  // Reset transaction state when component mounts
  useEffect(() => {
    resetTransaction();
    console.log('Transaction state reset on component mount');
  }, [resetTransaction]);

  const handleSubmit = async (data: CarListingFormData, carId?: string) => {
    console.log('Form submission handler triggered');
    
    // Reset transaction state before new submission attempt
    resetTransaction();
    
    console.log('All localStorage items:');
    Object.keys(localStorage).forEach(key => {
      console.log(`${key}: ${localStorage.getItem(key)}`);
    });
    
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
      let valuationData;
      try {
        console.log('Pre-validating valuation data');
        valuationData = validateValuationData();
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
        // Ensure transaction state is reset after error
        resetTransaction();
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
        // Ensure transaction state is reset after error
        resetTransaction();
        return;
      }
      
      // Validate form data
      const errors = validateFormData(data);
      if (errors.length > 0) {
        toast.error("Please complete all required fields", {
          description: "Some information is missing or incomplete."
        });
        // Ensure transaction state is reset after error
        resetTransaction();
        return;
      }

      const uploadingToast = toast.loading("Uploading your listing...", {
        duration: 5000 // Don't make it infinite, enforce a timeout
      });

      console.log('Starting transaction execution');
      
      // Execute the submission within a transaction with timeout handling
      const submissionPromise = executeSubmission(
        "Submit Car Listing",
        async () => {
          console.log('Executing submission callback');
          const result = await submitCarListing(data, userId, carId);
          console.log('Submission completed successfully with result:', result);
          return result;
        },
        {
          description: `Submitting listing for ${data?.make || ''} ${data?.model || ''}`,
          metadata: {
            carId,
            make: data.make,
            model: data.model
          },
          onSuccess: (result) => {
            console.log('Submission success callback triggered');
            toast.dismiss(uploadingToast);
            
            toast.success("Listing submitted successfully!", {
              description: "Your listing will be reviewed by our team."
            });
            
            // Clean up storage after successful submission
            cleanupFormStorage();
            
            // Show success dialog
            setShowSuccessDialog(true);
          },
          onError: (error) => {
            console.log('Submission error callback triggered', error);
            toast.dismiss(uploadingToast);
            
            if ('message' in error && 'description' in error) {
              const submissionError = error as SubmissionErrorType;
              setError(submissionError.message);
              
              toast.error(submissionError.message, {
                description: submissionError.description
              });
            } else {
              handleSupabaseError(error, "Failed to submit listing");
            }
            
            // Ensure transaction state is reset after error
            resetTransaction();
          }
        } as TransactionOptions
      );
      
      // Add a timeout to prevent the transaction from hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Submission timed out after 30 seconds"));
        }, 30000);
      });
      
      try {
        // Race between the submission and the timeout
        const result = await Promise.race([submissionPromise, timeoutPromise]);
        return result;
      } catch (timeoutError: any) {
        console.error('Submission timed out:', timeoutError);
        toast.dismiss(uploadingToast);
        toast.error("Submission timed out", {
          description: "Please try again. If the problem persists, contact support."
        });
        
        // Force reset of transaction state
        resetTransaction();
        return null;
      }
      
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
      
      // Ensure transaction state is reset after error
      resetTransaction();
      
      throw error;
    }
  };

  return {
    submitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    resetTransaction  // Expose the reset function to allow explicit resets
  };
};
