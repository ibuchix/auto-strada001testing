import { useState } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFormDefaults } from "./useFormDefaults";
import { useFormAutoSave } from "./useFormAutoSave";
import { useLoadDraft } from "./useLoadDraft";

export const useCarListingForm = (userId?: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carId, setCarId] = useState<string>();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const valuationData = JSON.parse(localStorage.getItem('valuationData') || '{}');

  const form = useForm<CarListingFormData>({
    defaultValues: getFormDefaults(),
  });

  useLoadDraft(form, setCarId, setLastSaved, userId);
  useFormAutoSave(form, setLastSaved, valuationData, userId, carId);

  const onSubmit = async (data: CarListingFormData) => {
    setIsSubmitting(true);
    try {
      // Remove any undefined or null values to prevent database errors
      const carData = {
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
        seller_notes: data.sellerNotes,
        is_draft: false,
      };

      // Filter out undefined and null values
      const filteredCarData = Object.fromEntries(
        Object.entries(carData).filter(([_, value]) => value !== undefined && value !== null)
      );

      const { data: savedCar, error } = await supabase
        .from('cars')
        .upsert(filteredCarData)
        .select()
        .single();

      if (error) throw error;

      setCarId(savedCar.id);
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