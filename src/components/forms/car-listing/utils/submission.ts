
/**
 * Changes made:
 * - 2024-03-20: Fixed infinite type instantiation error
 * - 2024-03-20: Updated property names to match database schema
 * - 2024-08-04: Updated name field to use seller_name to match database schema
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field has_documentation
 */

import { supabase } from "@/integrations/supabase/client";
import { CarListingFormData } from "@/types/forms";

export const saveFormAsDraft = async (
  data: Partial<CarListingFormData>,
  userId: string,
  carId?: string
) => {
  const valuationData = localStorage.getItem('valuationData');
  
  if (!valuationData) {
    throw new Error("Missing valuation data");
  }
  
  const parsedValuationData = JSON.parse(valuationData);
  const timestamp = new Date().toISOString();
  
  // If we have an existing car ID, update it
  if (carId) {
    return await supabase
      .from('cars')
      .update({
        seller_id: userId,
        seller_name: data.name, // Use seller_name instead of name
        address: data.address,
        mobile_number: data.mobileNumber,
        features: data.features,
        is_damaged: data.isDamaged,
        is_registered_in_poland: data.isRegisteredInPoland,
        is_selling_on_behalf: data.isSellingOnBehalf,
        has_private_plate: data.hasPrivatePlate,
        finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
        service_history_type: data.serviceHistoryType,
        seller_notes: data.sellerNotes,
        seat_material: data.seatMaterial,
        number_of_keys: data.numberOfKeys ? parseInt(data.numberOfKeys) : 1,
        updated_at: timestamp,
        additional_photos: data.uploadedPhotos || []
      })
      .eq('id', carId);
  }
  
  // Otherwise create a new draft
  return await supabase
    .from('cars')
    .insert({
      seller_id: userId,
      title: `${parsedValuationData.make} ${parsedValuationData.model} ${parsedValuationData.year}`,
      make: parsedValuationData.make,
      model: parsedValuationData.model,
      year: parsedValuationData.year,
      vin: parsedValuationData.vin,
      mileage: parseInt(localStorage.getItem('tempMileage') || '0'),
      price: parsedValuationData.valuation || parsedValuationData.averagePrice,
      transmission: parsedValuationData.transmission as string,
      valuation_data: parsedValuationData,
      is_draft: true,
      seller_name: data.name, // Use seller_name instead of name
      address: data.address,
      mobile_number: data.mobileNumber,
      features: data.features,
      is_damaged: data.isDamaged,
      is_registered_in_poland: data.isRegisteredInPoland,
      is_selling_on_behalf: data.isSellingOnBehalf,
      has_private_plate: data.hasPrivatePlate,
      finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
      service_history_type: data.serviceHistoryType,
      seller_notes: data.sellerNotes,
      seat_material: data.seatMaterial,
      number_of_keys: data.numberOfKeys ? parseInt(data.numberOfKeys) : 1,
      additional_photos: data.uploadedPhotos || []
    });
};
