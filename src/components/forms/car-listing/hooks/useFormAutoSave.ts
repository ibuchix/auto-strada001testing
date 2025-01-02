import { useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

const SAVE_DEBOUNCE_TIME = 2000; // 2 seconds debounce
const SAVE_TIMEOUT = 10000; // 10 seconds timeout

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
      const savePromise = supabase.from('cars').upsert({
        id: carId,
        seller_id: userId,
        ...valuationData,
        name: formData.name,
        address: formData.address,
        mobile_number: formData.mobileNumber,
        is_damaged: formData.isDamaged,
        is_registered_in_poland: formData.isRegisteredInPoland,
        features: formData.features,
        seat_material: formData.seatMaterial,
        number_of_keys: parseInt(formData.numberOfKeys),
        has_tool_pack: formData.hasToolPack,
        has_documentation: formData.hasDocumentation,
        is_selling_on_behalf: formData.isSellingOnBehalf,
        has_private_plate: formData.hasPrivatePlate,
        finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
        service_history_type: formData.serviceHistoryType,
        seller_notes: formData.sellerNotes,
        is_draft: true,
        last_saved: new Date().toISOString(),
      }).select();

      // Create a timeout promise
      const timeoutPromise = new Promise<{ error: PostgrestError }>((_, reject) => {
        setTimeout(() => reject(new Error('Save operation timed out')), SAVE_TIMEOUT);
      });

      // Race between the save operation and the timeout
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