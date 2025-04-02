
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
 * - Fixed TypeScript errors with proper type guards
 * - Optimized function execution paths for faster performance
 * - Implemented memoization patterns for expensive operations
 * - Added idempotency key support to prevent duplicate submissions
 */

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { ValidationError, SubmissionError, normalizeError } from "./errors";
import { BaseApplicationError } from "@/errors/classes";
import { 
  generateIdempotencyKey, 
  getCurrentIdempotencyKey, 
  cleanupIdempotencyKeys 
} from "@/utils/idempotencyUtils";
import { RecoveryType, ValidationErrorCode } from "@/errors/types";

// Configuration constants
const SUBMISSION_TIMEOUT = 30000;
const TOAST_DURATION = 5000;
const SUBMISSION_OPERATION = 'car_submission';

// Type guard for error objects
function isSubmissionErrorType(error: unknown): error is SubmissionErrorType {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as any).message === 'string'
  );
}

export const useFormSubmission = (userId?: string) => {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
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

  // Initialize idempotency key on component mount
  useEffect(() => {
    // Try to get an existing key first
    const existingKey = getCurrentIdempotencyKey(SUBMISSION_OPERATION);
    if (existingKey) {
      setIdempotencyKey(existingKey);
    } else {
      // Generate a new key if none exists
      const newKey = generateIdempotencyKey(SUBMISSION_OPERATION);
      setIdempotencyKey(newKey);
    }
    
    // Clean up old idempotency keys to prevent localStorage bloat
    cleanupIdempotencyKeys();
    
    // Reset transaction state
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
      throw new ValidationError({
        code: ValidationErrorCode.MISSING_VALUATION,
        message: error.message || "Missing valuation data",
        description: error.description || "Please complete the vehicle valuation first",
        recovery: {
          type: RecoveryType.NAVIGATE,
          label: "Start Valuation",
          action: () => navigate("/sellers")
        }
      });
    }
  }, [navigate]);

  const validateMileage = useCallback(() => {
    try {
      console.log('Validating mileage data');
      validateMileageData();
      console.log('Mileage validation successful');
    } catch (error: any) {
      console.error('Mileage validation failed:', error);
      throw new ValidationError({
        code: ValidationErrorCode.REQUIRED_FIELD,
        message: error.message || "Missing mileage data",
        description: error.description || "Please complete the vehicle valuation with mileage information",
        recovery: {
          type: RecoveryType.NAVIGATE,
          label: "Start Valuation",
          action: () => navigate("/sellers")
        }
      });
    }
  }, [navigate]);

  // Validate form data for completeness
  const validateForm = useCallback((data: CarListingFormData) => {
    if (!userId) {
      throw new ValidationError({
        code: ValidationErrorCode.AUTHENTICATION_REQUIRED,
        message: "Authentication Required",
        description: "Please sign in to submit a listing",
        recovery: {
          type: RecoveryType.SIGN_IN,
          label: "Sign In", 
          action: () => navigate("/auth")
        }
      });
    }

    const errors = validateFormData(data);
    if (errors.length > 0) {
      throw new ValidationError({
        code: ValidationErrorCode.INCOMPLETE_FORM,
        message: "Please complete all required fields",
        description: "Some information is missing or incomplete"
      });
    }
  }, [userId, navigate]);

  // Handle all types of submission errors - memoized for performance
  const handleSubmissionError = useCallback((error: unknown, uploadingToastId?: string | number) => {
    if (uploadingToastId) {
      toast.dismiss(uploadingToastId);
    }
    
    if (error instanceof ValidationError) {
      toast.error(error.message, {
        description: error.description,
        duration: TOAST_DURATION,
        action: error.recovery ? {
          label: error.recovery.label,
          onClick: error.recovery.action
        } : undefined
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
    if (isSubmissionErrorType(error)) {
      setError(error.message);
      
      toast.error(error.message, {
        description: error.description,
        duration: TOAST_DURATION,
        action: error.action
      });
      return;
    }

    // Fall back to generic Supabase error handling
    handleSupabaseError(error, "Failed to submit listing");
  }, [handleSupabaseError, setError]);

  // Memoize submission configuration to prevent unnecessary recreations
  const submissionConfig = useMemo(() => ({
    description: "Submitting car listing",
    onSuccess: (result: any) => {
      console.log('Submission success callback triggered');
      
      toast.success("Listing submitted successfully!", {
        description: "Your listing will be reviewed by our team."
      });
      
      // Clean up storage after successful submission
      cleanupFormStorage();
      
      // Show success dialog
      setShowSuccessDialog(true);
      
      return result;
    }
  }), []);

  const handleSubmit = useCallback(async (data: CarListingFormData, carId?: string) => {
    console.log('Form submission handler triggered');
    
    // Reset transaction state before new submission attempt
    resetTransaction();
    
    // Early return for validation failure
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
      // Run all validations in parallel where possible
      try {
        // Sequential validation where order matters
        const valuationData = await validateValuation();
        
        // Parallel validation for independent checks
        await Promise.all([
          Promise.resolve(validateMileage()),
          Promise.resolve(validateForm(data))
        ]);
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

      console.log('Starting transaction execution with idempotency key:', idempotencyKey);
      
      // Execute the submission within a transaction with timeout handling
      const transactionOptions: TransactionOptions = {
        description: `Submitting listing for ${data?.make || ''} ${data?.model || ''}`,
        metadata: {
          carId,
          make: data.make,
          model: data.model,
          idempotencyKey
        },
        onSuccess: (result) => {
          toast.dismiss(uploadingToast);
          submissionConfig.onSuccess(result);
        },
        onError: (error) => {
          console.log('Submission error callback triggered', error);
          handleSubmissionError(error, uploadingToast);
          
          // Generate a new idempotency key if the transaction failed
          // but not for duplicate submissions
          if (!(error instanceof SubmissionError && error.code === "DUPLICATE_SUBMISSION")) {
            const newKey = generateIdempotencyKey(SUBMISSION_OPERATION, carId);
            setIdempotencyKey(newKey);
          }
          
          // Ensure transaction state is reset after error
          resetTransaction();
        }
      };
      
      const submissionPromise = executeSubmission(
        "Submit Car Listing",
        async () => {
          console.log('Executing submission callback');
          return await submitCarListing(data, userId, carId, idempotencyKey || undefined);
        },
        transactionOptions
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
        
        // Generate a new idempotency key if the submission timed out
        const newKey = generateIdempotencyKey(SUBMISSION_OPERATION, carId);
        setIdempotencyKey(newKey);
        
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
    submissionConfig,
    setError,
    idempotencyKey
  ]);

  return {
    isSubmitting,
    error,
    transactionStatus,
    showSuccessDialog,
    setShowSuccessDialog,
    handleSubmit,
    resetTransaction,
    idempotencyKey
  };
};

// Import RecoveryType from errors/types
// Already imported at the top now
