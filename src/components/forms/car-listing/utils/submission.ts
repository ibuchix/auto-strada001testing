import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { FormSubmissionResult } from "../types/submission";
import { Json } from "@/integrations/supabase/types";
import { validateFormData } from "./validation";

export const handleFormSubmission = async (
  data: CarListingFormData,
  userId: string,
  valuationData: any
): Promise<FormSubmissionResult> => {
  try {
    console.log('Starting form submission with data:', { data, valuationData });
    
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

    // Generate title from valuation data
    const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`.trim();

    // Convert features to Json type
    const features: Json = {
      satNav: data.features?.satNav || false,
      panoramicRoof: data.features?.panoramicRoof || false,
      reverseCamera: data.features?.reverseCamera || false,
      heatedSeats: data.features?.heatedSeats || false,
      upgradedSound: data.features?.upgradedSound || false
    };

    console.log('Preparing car data with valuation:', valuationData);

    const carData = {
      seller_id: userId,
      title,
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
      make: valuationData.make,
      model: valuationData.model,
      year: valuationData.year,
      vin: valuationData.vin,
      mileage: valuationData.mileage,
      price: valuationData.valuation,
      transmission: valuationData.transmission || null,
      fuel_type: valuationData.fuel_type || null,
      valuation_data: valuationData,
      is_draft: false
    };

    console.log('Submitting car data:', carData);

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