
/**
 * Changes made:
 * - 2025-06-10: Created schema validation hook for form components
 * - 2027-11-07: Enhanced with improved error handling and diagnostics
 * - 2025-04-19: Updated imports to use new schema validation module structure
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  validateFormSchema, 
  resetSchemaValidationCache, 
  getSchemaValidationDiagnostics 
} from '@/utils/validation/schema';
import { useForm } from 'react-hook-form';

/**
 * Hook for validating form data against database schema
 * Only runs validation in development mode
 */
export const useSchemaValidation = <T extends Record<string, any>>(
  form: ReturnType<typeof useForm<T>>, 
  tableName: string,
  options = { 
    validateOnChange: true,
    validateOnMount: true,
    debounceMs: 500
  }
) => {
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<Date | null>(null);
  const { validateOnChange, validateOnMount, debounceMs } = options;
  
  // Debounced validation to avoid too many calls
  let debounceTimer: ReturnType<typeof setTimeout>;
  
  // Validate current form values against schema
  const validateSchema = useCallback(async (shouldDebounce = true): Promise<boolean> => {
    try {
      // Clear existing timer if any
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      if (shouldDebounce && debounceMs > 0) {
        return new Promise((resolve) => {
          debounceTimer = setTimeout(async () => {
            const result = await performValidation();
            resolve(result);
          }, debounceMs);
        });
      } else {
        return performValidation();
      }
    } catch (error) {
      console.error('Schema validation error:', error);
      return false;
    }
  }, [form, tableName, debounceMs]);
  
  // Actual validation logic
  const performValidation = async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      const formData = form.getValues();
      const issues = await validateFormSchema(formData, tableName);
      setValidationIssues(issues);
      setLastValidated(new Date());
      return issues.length === 0;
    } finally {
      setIsValidating(false);
    }
  };
  
  // Force validation immediately without debouncing
  const forceValidation = async (): Promise<boolean> => {
    return validateSchema(false);
  };
  
  // Reset the schema validation cache for this table
  const resetValidationCache = useCallback(() => {
    resetSchemaValidationCache(tableName);
    return forceValidation();
  }, [tableName]);
  
  // Get diagnostic information
  const getDiagnostics = useCallback(() => {
    return {
      ...getSchemaValidationDiagnostics(),
      hookState: {
        validationIssues,
        isValidating,
        lastValidated,
        tableName
      }
    };
  }, [validationIssues, isValidating, lastValidated, tableName]);
  
  // Run validation when form values change
  useEffect(() => {
    if (validateOnChange) {
      const subscription = form.watch(() => {
        validateSchema(true);
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, validateOnChange, validateSchema]);
  
  // Run validation once on mount if enabled
  useEffect(() => {
    if (validateOnMount) {
      validateSchema(false);
    }
  }, []);
  
  return {
    validationIssues,
    hasSchemaErrors: validationIssues.length > 0,
    isValidating,
    lastValidated,
    validateSchema,
    forceValidation,
    resetValidationCache,
    getDiagnostics
  };
};

export default useSchemaValidation;
