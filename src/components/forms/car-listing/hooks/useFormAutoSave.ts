import { useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";

const SAVE_DEBOUNCE_TIME = 2000;
const SAVE_TIMEOUT = 10000;

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

  const saveData = useCallback(async (formData: CarListingFormData) => {
    if (!userId || isSavingRef.current) return;

    const currentData = JSON.stringify(formData);
    if (currentData === previousDataRef.current) return;

    isSavingRef.current = true;

    try {
      const carData = transformObjectToSnakeCase({
        id: carId,
        sellerId: userId,
        ...valuationData,
        name: formData.name,
        address: formData.address,
        mobileNumber: formData.mobileNumber,
        isDamaged: formData.isDamaged,
        isRegisteredInPoland: formData.isRegisteredInPoland,
        features: formData.features,
        seatMaterial: formData.seatMaterial,
        numberOfKeys: parseInt(formData.numberOfKeys),
        hasToolPack: formData.hasToolPack,
        hasDocumentation: formData.hasDocumentation,
        isSellingOnBehalf: formData.isSellingOnBehalf,
        hasPrivatePlate: formData.hasPrivatePlate,
        financeAmount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
        serviceHistoryType: formData.serviceHistoryType,
        sellerNotes: formData.sellerNotes,
        isDraft: true,
        lastSaved: new Date().toISOString(),
        transmission: valuationData.transmission || null
      });

      const savePromise = supabase
        .from('cars')
        .upsert(carData)
        .select();

      const timeoutPromise = new Promise<{ error: PostgrestError }>((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out')), SAVE_TIMEOUT);
      });

      const result = await Promise.race([savePromise, timeoutPromise]);

      if (result.error) throw result.error;
      
      previousDataRef.current = currentData;
      setLastSaved(new Date());
      console.log('Auto-save successful');
    } catch (error) {
      console.error('Error autosaving:', error);
      toast.error('Failed to save changes. Will retry automatically.');
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
      saveData(formData);
    }, SAVE_DEBOUNCE_TIME);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form.watch(), saveData]);
};