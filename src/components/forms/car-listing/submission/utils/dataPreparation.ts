
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for preparing submission data
 */

import { CarListingFormData } from "@/types/forms";
import { calculateReservePrice } from "./reservePriceCalculator";

/**
 * Prepares car data for submission to Supabase
 * @param data Form data
 * @param carId Optional existing car ID
 * @param userId User ID
 * @param valuationData Valuation data
 * @returns Prepared data object for Supabase insertion
 */
export const prepareCarDataForSubmission = (
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
  
  // Calculate reserve price
  const reservePrice = calculateReservePrice(priceX);

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
