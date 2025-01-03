import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { FormSubmissionResult } from "../types/submission";
import { validateFormData } from "./validation";

export const handleFormSubmission = async (
  data: CarListingFormData,
  userId: string,
  valuationData: any
): Promise<FormSubmissionResult> => {
  try {
    const validationErrors = validateFormData(data);
    if (validationErrors.length > 0) {
      return {
        success: false,
        error: validationErrors[0].message
      };
    }

    if (!valuationData.make || !valuationData.model || !valuationData.year) {
      return {
        success: false,
        error: "Please complete the vehicle valuation first"
      };
    }

    const carData = {
      seller_id: userId,
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
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      vin: valuationData.vin,
      mileage: valuationData.mileage,
      price: valuationData.valuation,
      fuel_type: valuationData.fuelType || null,
      transmission: valuationData.gearbox || null,
      valuation_data: valuationData,
      is_draft: false
    };

    const { data: savedCar, error } = await supabase
      .from('cars')
      .upsert(carData)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: savedCar
    };
  } catch (error: any) {
    console.error('Form submission error:', error);
    return {
      success: false,
      error: error.message || "Failed to submit listing"
    };
  }
};