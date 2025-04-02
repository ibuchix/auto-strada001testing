
/**
 * Changes made:
 * - 2024-06-20: Extracted error section from FormContent.tsx
 * - Created a standalone component for validation error display
 * - 2024-06-25: Added memoization to prevent unnecessary re-renders
 * - 2024-06-25: Improved error message formatting
 * - 2024-06-26: Fixed performance issue by optimizing error flattening
 * - 2024-08-10: Enhanced memoization with useMemo and proper dependency tracking
 * - Added more aggressive early return pattern to prevent unnecessary rendering
 */

import { ValidationErrorDisplay } from "../ValidationErrorDisplay";
import { memo, useMemo } from "react";
import { isEqual } from "lodash";

interface FormErrorSectionProps {
  validationErrors: Record<number, string[]>;
}

// Use custom comparison function to avoid unnecessary re-renders
const areErrorsEqual = (prevProps: FormErrorSectionProps, nextProps: FormErrorSectionProps) => {
  return isEqual(prevProps.validationErrors, nextProps.validationErrors);
};

export const FormErrorSection = memo(({ validationErrors }: FormErrorSectionProps) => {
  // Early return for empty errors object
  if (!validationErrors || Object.keys(validationErrors).length === 0) {
    return null;
  }
  
  // Memoize the flattened errors to avoid recalculation on each render
  const flattenedErrors = useMemo(() => {
    const errors: string[] = [];
    
    Object.values(validationErrors).forEach(stepErrors => {
      if (Array.isArray(stepErrors) && stepErrors.length > 0) {
        errors.push(...stepErrors);
      }
    });
    
    return errors;
  }, [validationErrors]);
  
  // Don't render anything if there are no errors after flattening
  if (flattenedErrors.length === 0) {
    return null;
  }
  
  return <ValidationErrorDisplay errors={flattenedErrors} />;
}, areErrorsEqual);

// Add display name for React DevTools
FormErrorSection.displayName = "FormErrorSection";
