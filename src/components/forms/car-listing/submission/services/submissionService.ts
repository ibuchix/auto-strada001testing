
/**
 * Changes made:
 * - Implemented code splitting through dynamic imports
 * - Added server-side validation integration
 * - Improved error handling with more specific error types
 * - Fixed SubmissionError constructor calls to include required 'code' property
 * - Optimized function execution with early returns and performance improvements
 * - Added idempotency key support to prevent duplicate submissions
 * - Fixed headers usage in Supabase upsert method to resolve build error
 * - Added schema validation before submission
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { validateSubmission } from "./validationService";
import { SubmissionError } from "../errors";
import { 
  generateIdempotencyKey, 
  markIdempotencyKeyAsUsed, 
  isIdempotencyKeyUsed
} from "@/utils/idempotencyUtils";
import { validateExtendedCar } from "@/utils/validation/carSchema";

// Import helper functions using dynamic imports for code splitting
const getFormDataHelpers = () => import("../utils/dataPreparation");
const getStorageHelpers = () => import("../utils/storageCleanup");

// Constants
const SUBMISSION_OPERATION = 'car_submission';

/**
 * Submit car listing with complete validation
 * 
 * @param data - Form data to submit
 * @param userId - User ID submitting the form
 * @param carId - Optional existing car ID for updates
 * @param idempotencyKey - Optional existing idempotency key
 * @returns Promise resolving to submission result
 */
export const submitCarListing = async (
  data: CarListingFormData,
  userId: string,
  carId?: string,
  idempotencyKey?: string
) => {
  if (!data || !userId) {
    throw new SubmissionError({
      code: "INVALID_INPUT",
      message: "Missing required submission data",
      description: "Please ensure all required fields are filled in",
      retryable: true
    });
  }

  // Validate against schema
  const schemaValidation = validateExtendedCar(data);
  if (!schemaValidation.success) {
    const errorMessages = schemaValidation.errors?.errors.map(e => 
      `${e.path.join('.')}: ${e.message}`
    ).join(', ');
    
    throw new SubmissionError({
      code: "SCHEMA_VALIDATION_ERROR",
      message: "Form data doesn't match expected schema",
      description: errorMessages || "Please check all fields for errors",
      retryable: true
    });
  }

  // Generate or use provided idempotency key
  const submissionKey = idempotencyKey || generateIdempotencyKey(SUBMISSION_OPERATION, carId);

  // Check if this key has already been used successfully
  if (isIdempotencyKeyUsed(submissionKey)) {
    console.log(`Duplicate submission detected with key: ${submissionKey}`);
    throw new SubmissionError({
      code: "DUPLICATE_SUBMISSION",
      message: "This form has already been submitted",
      description: "The system detected a duplicate submission. Please refresh the page if you need to submit again.",
      retryable: false
    });
  }

  try {
    console.log('Starting submission process with validation');
    
    // Validate the submission with both client and server validation
    await validateSubmission(data, userId);
    
    // Dynamically import helper functions for code splitting
    const [formDataModule, storageModule] = await Promise.all([
      getFormDataHelpers(),
      getStorageHelpers()
    ]);
    
    const { prepareSubmissionData } = formDataModule;
    const { cleanupFormStorage } = storageModule;
    
    // Prepare submission data
    const submissionData = await prepareSubmissionData(data, userId, carId);
    console.log('Submission data prepared');
    
    // Add idempotency key to metadata
    submissionData.metadata = {
      ...(submissionData.metadata || {}),
      idempotencyKey: submissionKey
    };
    
    // Submit to Supabase - Fixed: Don't pass headers in the options object
    // The Supabase client requires headers to be passed at the client level
    // Create a client with the idempotency key in the headers
    const { data: result, error } = await supabase
      .from('cars')
      .upsert(submissionData, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Mark idempotency key as used after successful submission
    markIdempotencyKeyAsUsed(submissionKey);
    
    // Clean up local storage
    await cleanupFormStorage();
    
    console.log('Submission completed successfully with idempotency key:', submissionKey);
    return result;
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Only mark as used for specific errors (not for validation errors, network issues, etc.)
    if (error.code === 'duplicate_key_violates_unique_constraint') {
      // This might be a real duplicate, so mark the key as used
      markIdempotencyKeyAsUsed(submissionKey);
    }
    
    // Enhanced error handling with specific error types
    if (error.code?.startsWith('23') || error.code?.startsWith('22')) {
      // Database constraint or data type errors
      throw new SubmissionError({
        code: "DATABASE_CONSTRAINT",
        message: "Database constraint violation",
        description: "There was an issue with some of your data. Please try again.",
        retryable: true
      });
    }
    
    if (error.code === "SERVER_VALIDATION_FAILED") {
      // Re-throw validation errors
      throw error;
    }
    
    // Generic error for other issues
    throw new SubmissionError({
      code: "SUBMISSION_FAILED",
      message: error.message || "Failed to submit listing",
      description: "There was an error processing your submission",
      retryable: true
    });
  }
};
