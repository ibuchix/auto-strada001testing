
/**
 * Form Error Section component
 * - Extracted from FormContent.tsx to separate error display logic
 * - Fixed type mismatch between ValidationErrorDisplay and FormErrorSection props
 * - 2025-11-21: Added proper type handling for validation errors
 */
import { memo } from "react";
import { ValidationErrorDisplay } from "../ValidationErrorDisplay";

interface FormErrorSectionProps {
  validationErrors: Record<number, string[]>;
}

export const FormErrorSection = memo(({
  validationErrors
}: FormErrorSectionProps) => {
  // Only render if there are any errors
  const hasErrors = Object.values(validationErrors).some(
    errors => Array.isArray(errors) && errors.length > 0
  );
  
  if (!hasErrors) return null;
  
  // Convert the Record<number, string[]> to a flat string[] for ValidationErrorDisplay
  const flattenedErrors: string[] = Object.values(validationErrors)
    .flat()
    .filter(error => typeof error === 'string');
  
  return (
    <ValidationErrorDisplay errors={flattenedErrors} />
  );
});

FormErrorSection.displayName = 'FormErrorSection';
