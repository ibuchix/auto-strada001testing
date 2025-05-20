
/**
 * Hook for form initialization
 * Updated: 2025-05-20 - Fixed loading property reference
 */

import { useState, useEffect } from "react";
import { useFormData } from "../context/FormDataContext";
import { getInitialFormValues } from "./useFormHelpers";

export const useFormInitialization = (draftId?: string) => {
  const { form } = useFormData();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    try {
      // Initialize form with default values if no draft ID
      if (!draftId) {
        const initialValues = getInitialFormValues();
        form.reset(initialValues);
        setIsInitialized(true);
        setIsLoading(false);
        return;
      }

      // If there's a draft ID, we assume loading is handled elsewhere
      // and we're just waiting for it to complete
      setIsInitialized(true);
    } catch (err) {
      console.error("Form initialization error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [form, draftId]);

  return { isInitialized, isLoading, error };
};
