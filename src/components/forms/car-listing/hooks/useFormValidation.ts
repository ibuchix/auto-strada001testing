
/**
 * Hook for form validation
 * Created: 2025-07-02
 */

import { useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CarListingFormData } from '@/types/forms';

export const useFormValidation = () => {
  // Validate a specific step in the form
  const validateStep = useCallback(async (form: UseFormReturn<CarListingFormData>, fields?: string[]) => {
    if (!fields || fields.length === 0) {
      // If no fields are specified, validate the entire form
      return form.trigger();
    }

    // Validate only the specified fields
    const results = await Promise.all(fields.map(field => form.trigger(field as any)));
    return results.every(Boolean);
  }, []);

  return { validateStep };
};
