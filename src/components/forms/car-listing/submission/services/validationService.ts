/**
 * Form Validation Service
 * Created: 2025-05-03
 * 
 * Service for validating car listing form data
 */

import { CarListingFormData } from "@/types/forms";
import { ValidationSubmissionError } from '../errors';
import { ErrorCode } from "@/errors/types";

export const validateSubmission = async (data: CarListingFormData, userId: string): Promise<boolean> => {
  // Validate required fields
  if (!data.make || !data.model || !data.year || !data.mileage) {
    throw new ValidationSubmissionError({
      code: ErrorCode.INCOMPLETE_FORM,
      message: "Please complete all required fields",
      description: "Make, model, year, and mileage are required"
    });
  }
  
  // Check for VIN
  if (!data.vin) {
    throw new ValidationSubmissionError({
      code: ErrorCode.INCOMPLETE_FORM,
      message: "VIN is required",
      description: "Please enter the vehicle identification number"
    });
  }
  
  // Mock server-side validation success
  return true;
};
