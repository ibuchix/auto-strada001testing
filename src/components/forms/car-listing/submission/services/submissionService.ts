
/**
 * Changes made:
 * - Implemented code splitting through dynamic imports
 * - Added server-side validation integration
 * - Improved error handling with more specific error types
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { validateSubmission } from "./validationService";
import { SubmissionError } from "../errors";

// Import helper functions using dynamic imports for code splitting
const getFormDataHelpers = () => import("../utils/dataPreparation");
const getStorageHelpers = () => import("../utils/storageCleanup");

/**
 * Submit car listing with complete validation
 * 
 * @param data - Form data to submit
 * @param userId - User ID submitting the form
 * @param carId - Optional existing car ID for updates
 * @returns Promise resolving to submission result
 */
export const submitCarListing = async (
  data: CarListingFormData,
  userId: string,
  carId?: string
) => {
  try {
    console.log('Starting submission process with validation');
    
    // Validate the submission with both client and server validation
    await validateSubmission(data, userId);
    
    // Dynamically import helper functions for code splitting
    const { prepareSubmissionData } = await getFormDataHelpers();
    const { cleanupFormStorage } = await getStorageHelpers();
    
    // Prepare submission data
    const submissionData = await prepareSubmissionData(data, userId, carId);
    console.log('Submission data prepared');
    
    // Submit to Supabase
    const { data: result, error } = await supabase
      .from('cars')
      .upsert(submissionData)
      .select()
      .single();
    
    if (error) throw error;
    
    // Clean up local storage
    await cleanupFormStorage();
    
    console.log('Submission completed successfully');
    return result;
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Enhanced error handling with specific error types
    if (error.code?.startsWith('23') || error.code?.startsWith('22')) {
      // Database constraint or data type errors
      throw new SubmissionError({
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
      message: error.message || "Failed to submit listing",
      description: "There was an error processing your submission",
      retryable: true
    });
  }
};
