
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for preparing submission data
 * - 2024-06-19: Updated to handle async reserve price calculation
 * - 2024-06-20: Fixed function declaration to properly mark as async
 */

import { CarListingFormData } from "@/types/forms";
import { calculateReservePrice } from "./reservePriceCalculator";
import { supabase } from "@/integrations/supabase/client";

/**
 * Prepares car data for submission to Supabase
 * @param data Form data
 * @param carId Optional existing car ID
 * @param userId User ID
 * @param valuationData Valuation data
 * @returns Prepared data object for Supabase insertion
 */
export const prepareCarDataForSubmission = async (
  data: CarListingFormData, 
  carId: string | undefined, 
  userId: string | undefined,
  valuationData: any
) => {
  const mileage = parseInt(localStorage.getItem('tempMileage') || '0');
  
  // Calculate base price (average of min and med prices)
  const priceMin = valuationData.priceRanges?.minPrice || valuationData.valuation || 0;
  const priceMed = valuationData.priceRanges?.medPrice || valuationData.valuation || 0;
  const priceX = (priceMin + priceMed) / 2;
  
  // Try to use the database function for reserve price calculation (using the helper function)
  let reservePrice;
  try {
    const { data: dbReservePrice, error } = await supabase.rpc('calculate_reserve_price_from_min_med', {
      p_price_min: priceMin,
      p_price_med: priceMed
    });
    
    if (error || dbReservePrice === null) {
      // Fall back to client-side calculation
      reservePrice = await calculateReservePrice(priceX);
    } else {
      reservePrice = dbReservePrice;
    }
  } catch (error) {
    // Fall back to client-side calculation
    reservePrice = await calculateReservePrice(priceX);
  }

  return {
    id: carId,
    seller_id: userId,
    title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
    make: valuationData.make,
    model: valuationData.model,
    year: valuationData.year,
    vin: valuationData.vin,
    mileage: mileage,
    price: valuationData.valuation || valuationData.averagePrice,
    reserve_price: reservePrice,
    transmission: valuationData.transmission,
    valuation_data: valuationData,
    is_draft: false,
    name: data.name,
    address: data.address,
    mobile_number: data.mobileNumber,
    features: data.features,
    is_damaged: data.isDamaged,
    is_registered_in_poland: data.isRegisteredInPoland,
    has_tool_pack: data.hasToolPack,
    has_documentation: data.hasDocumentation,
    is_selling_on_behalf: data.isSellingOnBehalf,
    has_private_plate: data.hasPrivatePlate,
    finance_amount: data.financeAmount ? parseFloat(data.financeAmount) : null,
    service_history_type: data.serviceHistoryType,
    seller_notes: data.sellerNotes,
    seat_material: data.seatMaterial,
    number_of_keys: parseInt(data.numberOfKeys),
    additional_photos: data.uploadedPhotos
  };
};
