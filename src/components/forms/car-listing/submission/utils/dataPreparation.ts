/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for preparing submission data
 * - 2024-06-19: Updated to handle async reserve price calculation
 * - 2024-06-20: Fixed function declaration to properly mark as async
 * - 2024-06-21: Added proper error handling for reserve price calculation
 */

import { CarListingFormData } from "@/types/forms";
import { calculateReservePrice } from "./reservePriceCalculator";
import { supabase } from "@/integrations/supabase/client";

/**
 * Prepares car data for submission to Supabase
 */
export const prepareCarDataForSubmission = async (
  data: CarListingFormData, 
  carId: string | undefined, 
  userId: string | undefined,
  valuationData: any
) => {
  if (!valuationData.make || !valuationData.model || !valuationData.vin || !valuationData.mileage || !valuationData.valuation || !valuationData.year) {
    throw new Error("Please complete the vehicle valuation first");
  }

  // Calculate base price (average of min and med prices)
  const priceMin = valuationData.priceRanges?.minPrice || valuationData.valuation || 0;
  const priceMed = valuationData.priceRanges?.medPrice || valuationData.valuation || 0;
  const priceX = (priceMin + priceMed) / 2;
  
  // Calculate reserve price using the server function with client fallback
  let reservePrice;
  try {
    reservePrice = await calculateReservePrice(priceX);
  } catch (error) {
    console.error('Failed to calculate reserve price:', error);
    throw new Error('Failed to calculate reserve price. Please try again.');
  }

  return {
    id: carId,
    seller_id: userId,
    title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
    make: valuationData.make,
    model: valuationData.model,
    year: valuationData.year,
    vin: valuationData.vin,
    mileage: valuationData.mileage,
    price: valuationData.valuation,
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
