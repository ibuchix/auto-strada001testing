import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { isCarFeatures } from "@/utils/typeGuards";
import { getDefaultCarFeatures } from "@/utils/typeGuards";
import { toast } from "sonner";

export const useLoadDraft = (
  form: UseFormReturn<CarListingFormData>,
  setCarId: (id: string) => void,
  setLastSaved: (date: Date) => void,
  userId?: string,
  draftId?: string
) => {
  useEffect(() => {
    const loadDraft = async () => {
      if (!userId) return;

      try {
        let query = supabase
          .from('cars')
          .select('*')
          .eq('seller_id', userId)
          .eq('is_draft', true);

        // Only add the draftId condition if it exists and is not empty
        if (draftId && draftId.trim() !== '') {
          query = query.eq('id', draftId);
        }

        const { data: draft, error } = await query.maybeSingle();

        if (error) {
          console.error('Error loading draft:', error);
          return;
        }

        if (draft) {
          console.log('Loading draft data:', draft);
          setCarId(draft.id);
          setLastSaved(new Date(draft.last_saved));
          
          const features = isCarFeatures(draft.features) 
            ? draft.features 
            : getDefaultCarFeatures();

          const seatMaterial = draft.seat_material as CarListingFormData["seatMaterial"] || "cloth";

          form.reset({
            name: draft.name || "",
            address: draft.address || "",
            mobileNumber: draft.mobile_number || "",
            isDamaged: draft.is_damaged || false,
            isRegisteredInPoland: draft.is_registered_in_poland || false,
            features,
            seatMaterial,
            numberOfKeys: draft.number_of_keys?.toString() as "1" | "2" || "1",
            hasToolPack: draft.has_tool_pack || false,
            hasDocumentation: draft.has_documentation || false,
            isSellingOnBehalf: draft.is_selling_on_behalf || false,
            hasPrivatePlate: draft.has_private_plate || false,
            financeAmount: draft.finance_amount?.toString() || "",
            serviceHistoryType: draft.service_history_type || "none",
            sellerNotes: draft.seller_notes || "",
            uploadedPhotos: [],
            transmission: draft.transmission || null
          });
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
        toast.error("Failed to load draft listing");
      }
    };

    loadDraft();
  }, [userId, draftId]);
};