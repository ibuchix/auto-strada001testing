
/**
 * Changes made:
 * - 2024-03-20: Fixed type references to match database schema
 * - 2024-03-20: Updated property names to match database schema
 * - 2024-03-25: Updated car preparation to include seller_id field
 * - 2024-07-24: Enhanced valuation data validation with more helpful error messages
 * - 2024-07-27: Fixed type comparison error when checking mileage value
 * - 2024-07-28: Added robust mileage retrieval with fallbacks from localStorage
 * - 2024-08-04: Fixed "name" column issue by using seller_name field instead
 * - 2025-05-30: Enhanced field mapping to include both name and seller_name fields
 *   for backward compatibility with the security definer function
 * - 2025-05-31: Standardized field mapping approach across all transforms
 */

import { CarListingFormData } from "@/types/forms";

export const prepareCarData = (
  data: CarListingFormData,
  valuationData: any,
  userId: string
): any => {
  // More thorough validation of valuationData
  if (!valuationData) {
    throw new Error("Valuation data is missing. Please complete the vehicle valuation first.");
  }
  
  // Check for required valuation fields with specific error messages
  if (!valuationData.make) {
    throw new Error("Vehicle make information missing. Please complete the valuation process again.");
  }
  
  if (!valuationData.model) {
    throw new Error("Vehicle model information missing. Please complete the valuation process again.");
  }
  
  if (!valuationData.vin) {
    throw new Error("Vehicle VIN information missing. Please complete the valuation process again.");
  }
  
  // Improved mileage detection with multiple fallbacks
  let mileage: number | null = null;
  
  // Try to get mileage from valuationData first
  if (valuationData.mileage !== undefined && valuationData.mileage !== null) {
    mileage = Number(valuationData.mileage);
    console.log('Using mileage from valuation data:', mileage);
  } 
  // Then try localStorage as fallback
  else {
    const storedMileage = localStorage.getItem('tempMileage');
    if (storedMileage) {
      mileage = Number(storedMileage);
      console.log('Using mileage from localStorage:', mileage);
      
      // Update valuationData with the mileage from localStorage for consistency
      valuationData.mileage = mileage;
    }
  }
  
  // Final validation of mileage
  if ((mileage === null || isNaN(mileage)) && mileage !== 0) {
    throw new Error("Vehicle mileage information missing. Please complete the valuation process again.");
  }
  
  if (!valuationData.valuation && !valuationData.averagePrice) {
    throw new Error("Vehicle price valuation missing. Please complete the valuation process again.");
  }
  
  if (!valuationData.year) {
    throw new Error("Vehicle year information missing. Please complete the valuation process again.");
  }

  const title = `${valuationData.make} ${valuationData.model} ${valuationData.year}`.trim();
  if (!title) {
    throw new Error("Unable to generate listing title");
  }

  // Use either valuation or averagePrice, whichever is available
  const price = valuationData.valuation || valuationData.averagePrice || 0;

  return {
    seller_id: userId,
    title,
    // Send both name and seller_name for maximum compatibility with both fields
    name: data.name, // For compatibility with code expecting name field
    seller_name: data.name, // For compatibility with database schema
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
    mileage: mileage, // Using the validated mileage value
    price: price,
    transmission: valuationData.transmission || null,
    valuation_data: valuationData,
    is_draft: true,
    additional_photos: data.uploadedPhotos || []
  };
};
