import { useState } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getFormDefaults } from "./useFormDefaults";
import { useFormAutoSave } from "./useFormAutoSave";
import { useLoadDraft } from "./useLoadDraft";
import { Database } from "@/integrations/supabase/types";

type Cars = Database["public"]["Tables"]["cars"]["Insert"];
type Json = Database["public"]["Tables"]["cars"]["Insert"]["features"];

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

  const prepareCarData = (data: CarListingFormData): Cars => {
    if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation) {
      throw new Error("Please complete the vehicle valuation first");
    }

    const features = data.features as unknown as Json;

    return {
      id: carId,
      seller_id: userId,
      title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
      vin: valuationData.vin,
      mileage: valuationData.mileage,
      price: valuationData.valuation,
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      name: data.name,
      address: data.address,
      mobile_number: data.mobileNumber,
      is_damaged: data.isDamaged,
      is_registered_in_poland: data.isRegisteredInPoland,
      features,
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
  };

  const onSubmit = async (data: CarListingFormData) => {
    if (isSubmitting) return { success: false };
    
    setIsSubmitting(true);
    
    try {
      const carData = prepareCarData(data);
      const { data: savedCar, error } = await supabase
        .from('cars')
        .upsert(carData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!savedCar) {
        throw new Error('Failed to save car data');
      }

      setCarId(savedCar.id);
      return { success: true, carId: savedCar.id };
    } catch (error: any) {
      console.error('Error listing car:', error);
      throw error;
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