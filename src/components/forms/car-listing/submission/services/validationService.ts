
/**
 * Validation service for car listing submissions
 * Combines client and server validation with schema validation
 * - Fixed import for validation utils
 * - 2025-04-03: Added internal validateFormData function to fix import error
 * - 2025-11-29: Updated to use extendedCarSchema validation
 */

import { CarListingFormData } from "@/types/forms";
import { validateCarListingServer, validateSubmissionRate } from "@/validation/serverValidation";
import { ValidationError } from "../errors";
import { validateExtendedCar } from "@/utils/validation/carSchema";
import { ValidationErrorCode } from "@/errors/types";

// Create local validateFormData function instead of importing it
const validateFormData = (data: CarListingFormData): string[] => {
  const errors: string[] = [];
  
  // Add basic validation checks
  if (!data.make) errors.push("Make is required");
  if (!data.model) errors.push("Model is required");
  if (!data.year) errors.push("Year is required");
  if (!data.mileage) errors.push("Mileage is required");
  
  return errors;
};

/**
 * Performs comprehensive validation for car listing submission
 * Combines client-side, schema-based, and server-side validation
 * 
 * @param data - Form data to validate
 * @param userId - User ID for rate limiting
 * @returns Promise resolving to validated data or throwing ValidationError
 */
export const validateSubmission = async (
  data: CarListingFormData,
  userId: string
): Promise<CarListingFormData> => {
  // 1. First do schema validation
  const schemaValidation = validateExtendedCar(data);
  
  if (!schemaValidation.success) {
    const errorMessages = schemaValidation.error?.errors.map(e => 
      `${e.path.join('.')}: ${e.message}`
    ).join(', ');
    
    throw new ValidationError({
      code: ValidationErrorCode.SCHEMA_VALIDATION_ERROR,
      message: "Schema validation failed",
      description: errorMessages || "Some fields don't match the expected format"
    });
  }
  
  // 2. Then do client-side validation for more specific business rules
  const clientErrors = validateFormData(data);
  
  if (clientErrors.length > 0) {
    throw new ValidationError({
      code: ValidationErrorCode.INCOMPLETE_FORM,
      message: "Please complete all required fields",
      description: "Some information is missing or incomplete"
    });
  }
  
  // 3. Check submission rate limiting
  const isAllowed = await validateSubmissionRate(userId);
  
  if (!isAllowed) {
    throw new ValidationError({
      code: ValidationErrorCode.RATE_LIMIT_EXCEEDED,
      message: "Submission limit reached",
      description: "You've reached the maximum number of submissions allowed in a 24-hour period"
    });
  }
  
  // 4. Perform more intensive server-side validation
  const serverValidation = await validateCarListingServer(data);
  
  if (!serverValidation.success) {
    throw new ValidationError({
      code: ValidationErrorCode.SERVER_VALIDATION_FAILED,
      message: "Validation failed",
      description: serverValidation.errors?.[0] || "Please check your submission and try again"
    });
  }
  
  // Return the validated data
  return data;
};
