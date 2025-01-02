import { useState } from "react";
import { useForm } from "react-hook-form";
import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { getFormDefaults } from "./useFormDefaults";
import { useLoadDraft } from "./useLoadDraft";
import { useFormAutoSave } from "./useFormAutoSave";
import { toast } from "sonner";

type Cars = Database["public"]["Tables"]["cars"]["Insert"];

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
    console.log('Preparing car data with valuation:', valuationData);
    
    if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation) {
      throw new Error("Please complete the vehicle valuation first");
    }

    if (!userId) {
      throw new Error("User must be logged in to save car information");
    }

    const features = {
      satNav: data.features?.satNav || false,
      panoramicRoof: data.features?.panoramicRoof || false,
      reverseCamera: data.features?.reverseCamera || false,
      heatedSeats: data.features?.heatedSeats || false,
      upgradedSound: data.features?.upgradedSound || false
    };

    // Only include the fields that exist in the database
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
      valuation_data: valuationData, // Store the complete valuation data as JSON
    };
  };

  const onSubmit = async (data: CarListingFormData): Promise<boolean> => {
    if (isSubmitting) return false;
    
    setIsSubmitting(true);
    console.log('Form data being submitted:', data);
    
    try {
      const carData = prepareCarData(data);
      console.log('Prepared car data:', carData);
      
      const { data: savedCar, error } = await supabase
        .from('cars')
        .upsert(carData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Car saved successfully:', savedCar);
      if (savedCar?.id) {
        setCarId(savedCar.id);
        setLastSaved(new Date());
        return true;
      } else {
        console.error('No car ID returned from save operation');
        return false;
      }
    } catch (error: any) {
      console.error('Error saving car:', error);
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