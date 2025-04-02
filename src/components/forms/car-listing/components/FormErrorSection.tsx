
/**
 * Changes made:
 * - 2024-06-20: Extracted error handling from FormContent.tsx
 * - Created a dedicated component for error display and handling
 * - 2024-06-21: Fixed TypeScript typing to properly handle error object
 * - 2024-06-22: Updated interface to accept Record<number, string[]> for step validation errors
 */

import { ValidationErrorDisplay } from "../ValidationErrorDisplay";

interface FormErrorSectionProps {
  validationErrors: string[] | Record<string, string> | Record<number, string[]>;
}

export const FormErrorSection = ({ validationErrors }: FormErrorSectionProps) => {
  // Handle the case where validationErrors is an object with a numeric key
  if (
    typeof validationErrors === "object" && 
    !Array.isArray(validationErrors) && 
    Object.keys(validationErrors).length > 0
  ) {
    // Find the first key with errors
    const firstKey = Object.keys(validationErrors)[0];
    const currentStepErrors = validationErrors[firstKey];
    
    // If the errors are an array and it's empty, don't show anything
    if (Array.isArray(currentStepErrors) && currentStepErrors.length === 0) {
      return null;
    }
    
    // Pass the errors to the ValidationErrorDisplay component
    return <ValidationErrorDisplay validationErrors={currentStepErrors || []} />;
  }
  
  // Handle the case where validationErrors is an array
  if (Array.isArray(validationErrors) && validationErrors.length === 0) {
    return null;
  }
  
  return <ValidationErrorDisplay validationErrors={validationErrors} />;
};
