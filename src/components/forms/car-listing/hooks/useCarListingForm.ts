import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getDefaultCarFeatures, isCarFeatures } from "@/utils/typeGuards";

export const useCarListingForm = (userId?: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carId, setCarId] = useState<string>();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');

  const form = useForm<CarListingFormData>({
    defaultValues: {
      name: "",
      address: "",
      mobileNumber: "",
      isDamaged: false,
      isRegisteredInPoland: false,
      features: getDefaultCarFeatures(),
      seatMaterial: "cloth",
      numberOfKeys: "1",
      hasToolPack: false,
      hasDocumentation: false,
      isSellingOnBehalf: false,
      hasPrivatePlate: false,
      financeAmount: "",
      financeDocument: null,
      serviceHistoryType: "none",
    },
  });

  // Load existing draft
  useEffect(() => {
    const loadDraft = async () => {
      if (!userId) return;

      const { data: draft, error } = await supabase
        .from('cars')
        .select('*')
        .eq('seller_id', userId)
        .eq('is_draft', true)
        .single();

      if (error) {
        console.error('Error loading draft:', error);
        return;
      }

      if (draft) {
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
        });
      }
    };

    loadDraft();
  }, [userId]);

  useEffect(() => {
    const autoSave = async () => {
      if (!userId) return;

      const formData = form.getValues();
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
          is_draft: true,
          last_saved: new Date().toISOString(),
        });

        if (error) throw error;
        
        setLastSaved(new Date());
      } catch (error) {
        console.error('Error autosaving:', error);
      }
    };

    const timer = setTimeout(autoSave, 3000);
    return () => clearTimeout(timer);
  }, [form.watch(), userId]);

  const onSubmit = async (data: CarListingFormData) => {
    setIsSubmitting(true);
    try {
      const { data: carData, error } = await supabase.from('cars').upsert({
        id: carId,
        seller_id: userId,
        ...valuationData,
        name: data.name,
        address: data.address,
        mobile_number: data.mobileNumber,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        features: data.features,
        seat_material: data.seatMaterial,
        number_of_keys: parseInt(data.numberOfKeys),
        has_tool_pack: data.hasToolPack,
        has_documentation: data.hasDocumentation,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
        is_draft: false,
      }).select().single();

      if (error) throw error;

      setCarId(carData.id);
      toast.success("Basic information saved. Please upload the required photos.");
    } catch (error) {
      console.error('Error listing car:', error);
      toast.error("Failed to list car. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    carId,
    lastSaved,
    onSubmit,
  };
};