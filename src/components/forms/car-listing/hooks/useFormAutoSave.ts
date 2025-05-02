
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of auto-save functionality
 * - 2024-03-19: Added debounce mechanism
 * - 2024-03-19: Implemented data persistence with Supabase
 * - 2025-06-18: Added isSaving state for better UI feedback
 * - 2025-06-18: Improved debounce mechanism
 * - 2025-06-18: Enhanced error handling
 * - 2025-06-06: Fixed import by implementing local save functionality
 * - 2025-05-02: Disabled auto-save to database, only saves to localStorage
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { SAVE_DEBOUNCE_TIME } from "../constants";

export const useFormAutoSave = (
  form: UseFormReturn<CarListingFormData>,
  setLastSaved: (date: Date) => void,
  valuationData: any,
  userId?: string,
  carId?: string
) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>("");
  const isSavingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (formData: CarListingFormData) => {
    if (isSavingRef.current) return;

    const currentData = JSON.stringify(formData);
    if (currentData === previousDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      // Save to localStorage instead of database
      localStorage.setItem('car_form_data', currentData);
      
      previousDataRef.current = currentData;
      setLastSaved(new Date());
      console.log('Local save successful');
    } catch (error: any) {
      console.error('Error during local save:', error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [setLastSaved]);

  // Debounced save with cancellation of pending timeouts
  const debouncedSave = useCallback((formData: CarListingFormData) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(formData);
    }, SAVE_DEBOUNCE_TIME);
  }, [handleSave]);

  // Manual save that bypasses debounce
  const saveImmediately = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    const formData = form.getValues();
    return handleSave(formData);
  }, [form, handleSave]);

  // Set up auto-save when form data changes
  useEffect(() => {
    const formData = form.getValues();
    debouncedSave(formData);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form.watch(), debouncedSave]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        
        // Try to save one last time on unmount
        const formData = form.getValues();
        handleSave(formData);
      }
    };
  }, [form, handleSave]);

  return {
    isSaving,
    saveImmediately
  };
};
