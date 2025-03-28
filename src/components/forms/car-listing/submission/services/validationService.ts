
/**
 * Validation service for car listing submissions
 * Combines client and server validation
 */

import { CarListingFormData } from "@/types/forms";
import { validateFormData } from "../../utils/validation";
import { validateCarListingServer, validateSubmissionRate } from "@/validation/serverValidation";
import { ValidationError } from "../errors";

/**
 * Performs comprehensive validation for car listing submission
 * Combines client-side and server-side validation
 * 
 * @param data - Form data to validate
 * @param userId - User ID for rate limiting
 * @returns Promise resolving to validated data or throwing ValidationError
 */
export const validateSubmission = async (
  data: CarListingFormData,
  userId: string
): Promise<CarListingFormData> => {
  // 1. First do client-side validation for immediate feedback
  const clientErrors = validateFormData(data);
  
  if (clientErrors.length > 0) {
    throw new ValidationError({
      code: "INCOMPLETE_FORM",
      message: "Please complete all required fields",
      description: "Some information is missing or incomplete"
    });
  }
  
  // 2. Check submission rate limiting
  const isAllowed = await validateSubmissionRate(userId);
  
  if (!isAllowed) {
    throw new ValidationError({
      code: "RATE_LIMIT_EXCEEDED",
      message: "Submission limit reached",
      description: "You've reached the maximum number of submissions allowed in a 24-hour period"
    });
  }
  
  // 3. Perform more intensive server-side validation
  const serverValidation = await validateCarListingServer(data);
  
  if (!serverValidation.success) {
    throw new ValidationError({
      code: "SERVER_VALIDATION_FAILED",
      message: "Validation failed",
      description: serverValidation.errors?.[0] || "Please check your submission and try again"
    });
  }
  
  // Return the validated data
  return data;
};
