import { useEffect, useRef, useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";

export const useFormAutoSave = (
  form: UseFormReturn<CarListingFormData>,
  setLastSaved: (date: Date) => void,
  valuationData: any,
  userId?: string,
  carId?: string
) => {
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>("");

  const saveData = useCallback(async (formData: CarListingFormData) => {
    if (!userId) return;

    const currentData = JSON.stringify(formData);
    if (currentData === previousDataRef.current) return;
    
    previousDataRef.current = currentData;

    try {
      const { error } = await supabase.from('cars').upsert({
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
      });

      if (error) throw error;
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error autosaving:', error);
    }
  }, [userId, carId, valuationData, setLastSaved]);

  useEffect(() => {
    const formData = form.getValues();
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveData(formData);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form.watch(), saveData]);
};