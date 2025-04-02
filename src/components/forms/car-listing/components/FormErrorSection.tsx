
/**
 * Changes made:
 * - 2024-06-20: Extracted error handling from FormContent.tsx
 * - Created a dedicated component for error display and handling
 * - 2024-06-21: Fixed TypeScript typing to properly handle error object
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
    const currentStepErrors = Object.values(validationErrors)[0];
    if (Array.isArray(currentStepErrors) && currentStepErrors.length === 0) {
      return null;
    }
    
    return <ValidationErrorDisplay validationErrors={currentStepErrors || []} />;
  }
  
  // Handle the case where validationErrors is an array
  if (Array.isArray(validationErrors) && validationErrors.length === 0) {
    return null;
  }
  
  return <ValidationErrorDisplay validationErrors={validationErrors} />;
};
