
/**
 * Form Error Section component
 * - Extracted from FormContent.tsx to separate error display logic
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
  
  return (
    <ValidationErrorDisplay errors={validationErrors} />
  );
});

FormErrorSection.displayName = 'FormErrorSection';
