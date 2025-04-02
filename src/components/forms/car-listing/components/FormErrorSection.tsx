
/**
 * Changes made:
 * - 2024-06-20: Extracted error handling from FormContent.tsx
 * - Created a dedicated component for error display and handling
 * - 2024-06-21: Fixed TypeScript typing to properly handle error object
 * - 2024-06-22: Updated interface to accept Record<number, string[]> for step validation errors
 * - 2024-06-23: Improved error type handling to prevent infinite renders
 */

import { useMemo } from "react";
import { ValidationErrorDisplay } from "../ValidationErrorDisplay";

interface FormErrorSectionProps {
  validationErrors: string[] | Record<string, string> | Record<number, string[]>;
}

export const FormErrorSection = ({ validationErrors }: FormErrorSectionProps) => {
  // Memoize error processing to prevent unnecessary rerenders
  const processedErrors = useMemo(() => {
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
      
      // Return the errors from the first key
      return currentStepErrors || [];
    }
    
    // Handle the case where validationErrors is an array
    if (Array.isArray(validationErrors) && validationErrors.length === 0) {
      return null;
    }
    
    return validationErrors;
  }, [validationErrors]);
  
  // If no errors to display, return null
  if (!processedErrors) {
    return null;
  }
  
  // Pass the processed errors to the ValidationErrorDisplay component
  return <ValidationErrorDisplay validationErrors={processedErrors} />;
};
