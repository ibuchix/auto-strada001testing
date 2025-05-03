
/**
 * Utilities for preparing submission data
 * Extracted to separate module for code splitting
 * Updated: 2025-06-21 - Fixed field access to match CarListingFormData
 */

import { CarListingFormData } from "@/types/forms";
import { calculateReservePrice } from "./reservePriceCalculator";

/**
 * Prepares form data for submission to the database
 * 
 * @param data - Form data to prepare
 * @param userId - User ID submitting the form
 * @param carId - Optional existing car ID for updates
 * @returns Promise resolving to prepared submission data
 */
export const prepareSubmissionData = async (
  data: CarListingFormData,
  userId: string,
  carId?: string
): Promise<Record<string, any>> => {
  // Calculate reserve price if not already set
  const reservePrice = data.reserve_price || calculateReservePrice(Number(data.price));
  
  // Format the form data for database insertion
  const formattedData = {
    id: carId,
    seller_id: userId,
    seller_name: data.name || "",
    address: data.address || "",
    mobile_number: data.mobileNumber || "",
    title: `${data.make} ${data.model} ${data.year}`,
    make: data.make,
    model: data.model,
    year: Number(data.year),
    mileage: Number(data.mileage),
    price: Number(data.price),
    reserve_price: reservePrice,
    vin: data.vin,
    is_damaged: !!data.isDamaged,
    is_registered_in_poland: !!data.isRegisteredInPoland,
    has_private_plate: !!data.hasPrivatePlate,
    features: data.features || {},
    service_history_type: data.serviceHistoryType,
    seller_notes: data.sellerNotes,
    seat_material: data.seatMaterial,
    number_of_keys: Number(data.numberOfKeys || 1),
    is_draft: false,
    finance_amount: data.financeAmount ? Number(data.financeAmount) : null,
    transmission: data.transmission || 'manual',
    status: 'pending',
    updated_at: new Date().toISOString()
  };
  
  return formattedData;
};
