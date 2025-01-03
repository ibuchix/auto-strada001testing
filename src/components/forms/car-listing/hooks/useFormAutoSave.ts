import { useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

const SAVE_DEBOUNCE_TIME = 2000;
const SAVE_TIMEOUT = 10000;

type CarInsert = Database['public']['Tables']['cars']['Insert'];

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
      const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`.trim();
      
      const carData: CarInsert = {
        id: carId,
        seller_id: userId,
        title,
        make: valuationData.make,
        model: valuationData.model,
        year: valuationData.year,
        vin: valuationData.vin,
        mileage: valuationData.mileage,
        price: valuationData.valuation,
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
        transmission: valuationData.transmission || null
      };

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