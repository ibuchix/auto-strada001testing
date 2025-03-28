
/**
 * Changes made:
 * - Refactored for improved type safety and error handling
 * - Added clear separation of concerns with dedicated validation and error handling functions
 * - Improved memory management with proper cleanup
 * - Added constants for configuration values
 * - Reduced code duplication and improved readability
 * - Maintained compatibility with existing components
 * - Enhanced TypeScript usage with proper error typing
 * - Added useCallback for better performance
 */

import { useState, useEffect, useCallback } from "react";
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
import { ValidationError, SubmissionError } from "./errors";

// Configuration constants
const SUBMISSION_TIMEOUT = 30000;
const TOAST_DURATION = 5000;

export const useFormSubmission = (userId?: string) => {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const navigate = useNavigate();
  
  const { 
    error, 
    setError,
    handleSupabaseError 
  } = useSupabaseErrorHandling({ showToast: false });

  const { 
    execute: executeSubmission,
    isLoading: isSubmitting,
    transactionStatus,
    reset: resetTransaction
  } = useCreateTransaction({
    showToast: false,
    retryCount: 1,
    logToDb: true
  });

  // Reset transaction state when component mounts and clean up on unmount
  useEffect(() => {
    resetTransaction();
    return () => resetTransaction();
  }, [resetTransaction]);

  // Validate valuation data and mileage separately to provide specific error messages
  const validateValuation = useCallback(async () => {
    try {
      console.log('Pre-validating valuation data');
      const valuationData = validateValuationData();
      console.log('Valuation data pre-validation successful:', valuationData);
      return valuationData;
    } catch (error: any) {
      console.error('Valuation data validation failed:', error);
      throw new ValidationError(
        error.message || "Missing valuation data",
        error.description || "Please complete the vehicle valuation first",
        error.action || {
          label: "Start Valuation",
          onClick: () => navigate("/sellers")
        }
      );
    }
  }, [navigate]);

  const validateMileage = useCallback(() => {
    try {
      console.log('Validating mileage data');
      validateMileageData();
      console.log('Mileage validation successful');
    } catch (error: any) {
      console.error('Mileage validation failed:', error);
      throw new ValidationError(
        error.message || "Missing mileage data",
        error.description || "Please complete the vehicle valuation with mileage information",
        error.action || {
          label: "Start Valuation",
          onClick: () => navigate("/sellers")
        }
      );
    }
  }, [navigate]);

  // Validate form data for completeness
  const validateForm = useCallback((data: CarListingFormData) => {
    if (!userId) {
      throw new ValidationError(
        "Authentication Required",
        "Please sign in to submit a listing",
        { label: "Sign In", onClick: () => navigate("/auth") }
      );
    }

    const errors = validateFormData(data);
    if (errors.length > 0) {
      throw new ValidationError(
        "Please complete all required fields",
        "Some information is missing or incomplete"
      );
    }
  }, [userId, navigate]);

  // Handle all types of submission errors
  const handleSubmissionError = useCallback((error: unknown, uploadingToastId?: string | number) => {
    if (uploadingToastId) {
      toast.dismiss(uploadingToastId);
    }
    
    if (error instanceof ValidationError) {
      toast.error(error.message, {
        description: error.description,
        duration: TOAST_DURATION,
        action: error.action
      });
      return;
    }

    if (error instanceof SubmissionError) {
      toast.error(error.message, {
        description: error.description,
        duration: TOAST_DURATION,
        action: error.retryable ? {
          label: "Try Again",
          onClick: () => window.location.reload()
        } : undefined
      });
      return;
    }

    // Handle submission-specific errors
    if (error && typeof error === 'object' && 'message' in error && 'description' in error) {
      const submissionError = error as SubmissionErrorType;
      setError(submissionError.message);
      
      toast.error(submissionError.message, {
        description: submissionError.description,
        duration: TOAST_DURATION,
        action: submissionError.action
      });
      return;
    }

    // Fall back to generic Supabase error handling
    handleSupabaseError(error, "Failed to submit listing");
  }, [handleSupabaseError, setError]);

  const handleSubmit = useCallback(async (data: CarListingFormData, carId?: string) => {
    console.log('Form submission handler triggered');
    
    // Reset transaction state before new submission attempt
    resetTransaction();
    
    if (!userId) {
      toast.error("Please sign in to submit a listing", {
        description: "You'll be redirected to the login page.",
        duration: TOAST_DURATION,
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth")
        }
      });
      navigate("/auth");
      return;
    }

    setError(null);
    let uploadingToast: string | number = "";

    try {
      // Run all validations
      try {
        const valuationData = await validateValuation();
        validateMileage();
        validateForm(data);
      } catch (validationError) {
        if (validationError instanceof ValidationError) {
          handleSubmissionError(validationError);
        } else {
          toast.error("Validation failed", {
            description: "Please check all required fields and try again"
          });
        }
        resetTransaction();
        return;
      }

      // Start submission with loading indicator
      uploadingToast = toast.loading("Uploading your listing...", {
        duration: TOAST_DURATION
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
            handleSubmissionError(error, uploadingToast);
            
            // Ensure transaction state is reset after error
            resetTransaction();
          }
        } as TransactionOptions
      );
      
      // Add a timeout to prevent the transaction from hanging indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Submission timed out after 30 seconds"));
        }, SUBMISSION_TIMEOUT);
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
      handleSubmissionError(error, uploadingToast);
      
      // Ensure transaction state is reset after error
      resetTransaction();
      
      throw error;
    }
  }, [
    userId, 
    navigate, 
    resetTransaction, 
    executeSubmission, 
    validateValuation, 
    validateMileage, 
    validateForm,
    handleSubmissionError,
    setError
  ]);

  return {
    isSubmitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    resetTransaction
  };
};
