
/**
 * Form validation error handler
 * Created: 2025-07-22
 */

import { FieldErrors } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { toast } from "sonner";

export const handleFormValidationError = (errors: FieldErrors<CarListingFormData>) => {
  // Get all field errors
  const errorMessages = Object.entries(errors).map(([field, error]) => {
    return `${field}: ${error.message}`;
  });
  
  // Show toast with first error
  if (errorMessages.length > 0) {
    toast.error("Form validation failed", {
      description: errorMessages[0]
    });
  }
  
  // Return aggregated error messages
  return {
    success: false,
    errorMessages,
    firstError: errorMessages[0] || "Form validation failed"
  };
};
