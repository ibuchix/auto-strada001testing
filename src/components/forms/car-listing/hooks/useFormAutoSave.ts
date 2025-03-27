
/**
 * Changes made:
 * - 2024-03-19: Initial implementation of auto-save functionality
 * - 2024-03-19: Added debounce mechanism
 * - 2024-03-19: Implemented data persistence with Supabase
 * - 2025-06-18: Added isSaving state for better UI feedback
 * - 2025-06-18: Improved debounce mechanism
 * - 2025-06-18: Enhanced error handling
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { saveFormData } from "../utils/formSaveUtils";
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
    if (!userId || isSavingRef.current) return;

    const currentData = JSON.stringify(formData);
    if (currentData === previousDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    try {
      const result = await saveFormData(formData, userId, valuationData, carId);
      if (result.success) {
        previousDataRef.current = currentData;
        setLastSaved(new Date());
        console.log('Auto-save successful', result.carId ? `carId: ${result.carId}` : '');
        
        // Update carId ref if it was newly created
        if (result.carId && !carId) {
          console.log('New car ID obtained:', result.carId);
          // We don't set a new carId here as it should be managed by the parent component
        }
      } else if (result.error) {
        console.error('Auto-save failed:', result.error);
      }
    } catch (error: any) {
      console.error('Error during auto-save:', error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }, [userId, carId, valuationData, setLastSaved]);

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
        if (userId && !isSavingRef.current) {
          handleSave(formData);
        }
      }
    };
  }, [form, userId, handleSave]);

  return {
    isSaving,
    saveImmediately
  };
};
