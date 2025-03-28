
/**
 * Changes made:
 * - Created a standardized React Hook Form implementation
 * - Added consistent error handling and validation
 * - Implemented performance optimizations with defaultValues memoization
 * - Added form state persistence capabilities
 * - Fixed TypeScript error with defaultValues type
 */

import { useState, useEffect, useMemo } from "react";
import { 
  useForm, 
  UseFormProps, 
  FieldValues, 
  UseFormReturn, 
  SubmitHandler,
  SubmitErrorHandler,
  DefaultValues
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

type FormPersistenceOptions = {
  key: string;
  excludeFields?: string[];
  shouldPersist?: boolean;
}

interface UseFormWithValidationProps<T extends FieldValues> {
  schema: z.ZodType<T, any, any>;
  defaultValues: DefaultValues<T>;
  onSubmit: SubmitHandler<T>;
  onError?: SubmitErrorHandler<T>;
  persistenceOptions?: FormPersistenceOptions;
  formOptions?: Omit<UseFormProps<T>, 'resolver' | 'defaultValues'>;
}

export function useFormWithValidation<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onError,
  persistenceOptions,
  formOptions
}: UseFormWithValidationProps<T>): UseFormReturn<T> & {
  formState: { isSubmitting: boolean };
  handleSubmitWithFeedback: (e?: React.BaseSyntheticEvent) => Promise<void>;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Memoize default values to prevent unnecessary re-renders
  const memoizedDefaultValues = useMemo(() => defaultValues, []);

  // Initialize the form with zod resolver and default values
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: memoizedDefaultValues,
    ...formOptions
  });

  // Load persisted form data if persistenceOptions are provided
  useEffect(() => {
    if (persistenceOptions?.shouldPersist) {
      try {
        const savedData = localStorage.getItem(persistenceOptions.key);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Apply the saved data to the form
          if (persistenceOptions.excludeFields?.length) {
            // Filter out excluded fields
            const filteredData = { ...parsedData };
            persistenceOptions.excludeFields.forEach(field => {
              delete filteredData[field];
            });
            form.reset({ ...defaultValues, ...filteredData });
          } else {
            form.reset({ ...defaultValues, ...parsedData });
          }
        }
      } catch (error) {
        console.error('Failed to load persisted form data:', error);
      }
    }
  }, [persistenceOptions?.key, persistenceOptions?.shouldPersist]);

  // Save form data when it changes if persistenceOptions are provided
  useEffect(() => {
    if (persistenceOptions?.shouldPersist) {
      const subscription = form.watch((formValues) => {
        if (!formValues) return;
        
        try {
          // Filter out any excluded fields before saving
          if (persistenceOptions.excludeFields?.length) {
            const filteredValues = { ...formValues };
            persistenceOptions.excludeFields.forEach(field => {
              delete filteredValues[field];
            });
            localStorage.setItem(persistenceOptions.key, JSON.stringify(filteredValues));
          } else {
            localStorage.setItem(persistenceOptions.key, JSON.stringify(formValues));
          }
        } catch (error) {
          console.error('Failed to persist form data:', error);
        }
      });
      
      return () => subscription.unsubscribe();
    }
  }, [form, persistenceOptions]);

  // Enhanced submit handler with loading state and error handling
  const handleSubmitWithFeedback = async (e?: React.BaseSyntheticEvent) => {
    setIsSubmitting(true);
    
    try {
      await form.handleSubmit(
        // Success handler
        async (data) => {
          try {
            await onSubmit(data);
          } catch (error) {
            console.error('Form submission error:', error);
            toast.error('Error submitting form', {
              description: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
          }
        },
        // Error handler
        (errors) => {
          console.error('Form validation errors:', errors);
          
          // Show validation error toast
          const errorCount = Object.keys(errors).length;
          toast.error(`Validation failed: ${errorCount} ${errorCount === 1 ? 'error' : 'errors'}`, {
            description: 'Please check the form for errors and try again'
          });
          
          // Call custom error handler if provided
          if (onError) {
            onError(errors);
          }
        }
      )(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    ...form,
    formState: {
      ...form.formState,
      isSubmitting
    },
    handleSubmitWithFeedback
  };
}
