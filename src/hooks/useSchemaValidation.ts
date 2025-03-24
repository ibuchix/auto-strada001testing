
/**
 * Changes made:
 * - 2025-06-10: Created schema validation hook for form components
 */

import { useState, useEffect } from 'react';
import { validateFormSchema } from '@/utils/validation/schemaValidation';
import { useForm } from 'react-hook-form';

/**
 * Hook for validating form data against database schema
 * Only runs validation in development mode
 */
export const useSchemaValidation = <T extends Record<string, any>>(
  form: ReturnType<typeof useForm<T>>, 
  tableName: string,
  options = { validateOnChange: true }
) => {
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const { validateOnChange } = options;
  
  // Validate current form values against schema
  const validateSchema = async () => {
    try {
      setIsValidating(true);
      const formData = form.getValues();
      const issues = await validateFormSchema(formData, tableName);
      setValidationIssues(issues);
      return issues.length === 0;
    } catch (error) {
      console.error('Schema validation error:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };
  
  // Run validation when form values change
  useEffect(() => {
    if (validateOnChange) {
      const subscription = form.watch(() => {
        validateSchema();
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, validateOnChange]);
  
  return {
    validationIssues,
    hasSchemaErrors: validationIssues.length > 0,
    isValidating,
    validateSchema
  };
};

export default useSchemaValidation;
