import { useEffect, useRef, useCallback } from "react";
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

  const handleSave = useCallback(async (formData: CarListingFormData) => {
    if (!userId || isSavingRef.current) return;

    const currentData = JSON.stringify(formData);
    if (currentData === previousDataRef.current) return;

    isSavingRef.current = true;

    try {
      await saveFormData(formData, userId, valuationData, carId);
      previousDataRef.current = currentData;
      setLastSaved(new Date());
      console.log('Auto-save successful');
    } catch (error: any) {
      console.error('Error autosaving:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [userId, carId, valuationData, setLastSaved]);

  useEffect(() => {
    const formData = form.getValues();
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave(formData);
    }, SAVE_DEBOUNCE_TIME);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form.watch(), handleSave]);
};