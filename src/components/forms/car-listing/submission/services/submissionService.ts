
/**
 * Changes made:
 * - 2024-06-12: Created dedicated service for handling form submissions
 * - 2024-06-20: Fixed async/await issue with prepareCarDataForSubmission
 * - 2024-08-15: Added support for service history file uploads
 * - 2024-08-20: Improved error handling with standardized messages
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";
import { prepareCarDataForSubmission } from "../utils/dataPreparation";
import { validateValuationData } from "../utils/validationHandler";
import { SubmissionErrorType } from "../types";
import { parseSupabaseError } from "@/utils/validation";

/**
 * Submits car listing data to Supabase
 * @param data Form data
 * @param userId Current user ID
 * @param carId Optional existing car ID
 * @returns Result of the submission
 * @throws SubmissionErrorType if submission fails
 */
export const submitCarListing = async (
  data: CarListingFormData, 
  userId: string | undefined, 
  carId?: string
) => {
  if (!userId) {
    throw {
      message: "Authentication required",
      description: "Please sign in to submit a listing.",
      action: {
        label: "Sign In",
        onClick: () => window.location.href = "/auth"
      }
    } as SubmissionErrorType;
  }

  const valuationData = validateValuationData();
  
  try {
    // Await the prepared data before passing it to upsert
    const preparedData = await prepareCarDataForSubmission(data, carId, userId, valuationData);

    const { error } = await supabase
      .from('cars')
      .upsert(preparedData, {
        onConflict: 'id'
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Submission error:', error);
    
    // Use standardized error parsing for better error messages
    const errorMessage = parseSupabaseError(error);
    
    // Specific handling for duplicate entries
    if (error.code === '23505') {
      throw {
        message: "This vehicle has already been listed",
        description: "Each vehicle can only be listed once. Please try with a different VIN.",
        action: {
          label: "Try Again",
          onClick: () => window.location.href = '/sellers'
        }
      } as SubmissionErrorType;
    } else {
      throw {
        message: "Failed to save vehicle information",
        description: errorMessage || "Please try again or contact support if the problem persists.",
        action: {
          label: "Contact Support",
          onClick: () => window.location.href = 'mailto:support@example.com'
        }
      } as SubmissionErrorType;
    }
  }
};
