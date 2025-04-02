
/**
 * Changes made:
 * - 2024-06-20: Extracted error section from FormContent.tsx
 * - Created a standalone component for validation error display
 * - 2024-06-25: Added memoization to prevent unnecessary re-renders
 * - 2024-06-25: Improved error message formatting
 * - 2024-06-26: Fixed performance issue by optimizing error flattening
 * - Improved memoization with proper dependency tracking
 */

import { ValidationErrorDisplay } from "../ValidationErrorDisplay";
import { memo, useMemo } from "react";

interface FormErrorSectionProps {
  validationErrors: Record<number, string[]>;
}

export const FormErrorSection = memo(({ validationErrors }: FormErrorSectionProps) => {
  // Memoize the flattened errors to avoid recalculation on each render
  const flattenedErrors = useMemo(() => {
    // Early return for empty errors to avoid unnecessary processing
    if (!validationErrors || Object.keys(validationErrors).length === 0) {
      return [];
    }
    
    const errors: string[] = [];
    
    Object.values(validationErrors).forEach(stepErrors => {
      if (Array.isArray(stepErrors) && stepErrors.length > 0) {
        errors.push(...stepErrors);
      }
    });
    
    return errors;
  }, [validationErrors]);
  
  // Don't render anything if there are no errors - move this outside the component body
  if (flattenedErrors.length === 0) {
    return null;
  }
  
  return <ValidationErrorDisplay errors={flattenedErrors} />;
});

// Add display name for React DevTools
FormErrorSection.displayName = "FormErrorSection";
