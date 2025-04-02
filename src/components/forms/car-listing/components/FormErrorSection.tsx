
/**
 * Changes made:
 * - 2024-06-20: Extracted error handling from FormContent.tsx
 * - Created a dedicated component for error display and handling
 */

import { ValidationErrorDisplay } from "../ValidationErrorDisplay";

interface FormErrorSectionProps {
  validationErrors: string[];
}

export const FormErrorSection = ({ validationErrors }: FormErrorSectionProps) => {
  if (validationErrors.length === 0) {
    return null;
  }
  
  return (
    <ValidationErrorDisplay validationErrors={validationErrors} />
  );
};
