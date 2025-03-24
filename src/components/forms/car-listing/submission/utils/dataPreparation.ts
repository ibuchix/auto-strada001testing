
/**
 * Changes made:
 * - 2024-06-12: Created dedicated utility for preparing submission data
 * - 2024-06-19: Updated to handle async reserve price calculation
 * - 2024-06-20: Fixed function declaration to properly mark as async
 * - 2024-06-21: Added proper error handling for reserve price calculation
 * - 2024-07-24: Enhanced validation and fallback mechanisms for valuation data
 * - 2024-07-28: Improved mileage retrieval and validation with better error handling
 * - 2024-08-04: Fixed "name" column issue by mapping seller_name field correctly to database schema
 * - 2025-05-30: Enhanced field mapping to include both name and seller_name fields
 *   for backward compatibility with the security definer function
 * - 2025-05-31: Standardized field mapping approach across all data transformations
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field has_documentation
 * - 2025-06-10: Added schema validation to catch field mismatches before submission
 */

import { CarListingFormData } from "@/types/forms";
import { calculateReservePrice } from "./reservePriceCalculator";
import { supabase } from "@/integrations/supabase/client";
import { validateMileageData } from "./validationHandler";
import { validateFormSchema } from "@/utils/validation/schemaValidation";

/**
 * Prepares car data for submission to Supabase
 */
export const prepareCarDataForSubmission = async (
  data: CarListingFormData, 
  carId: string | undefined, 
  userId: string | undefined,
  valuationData: any
) => {
  console.log('Preparing car data for submission with valuation data:', valuationData);
  
  if (!valuationData) {
    throw new Error("Valuation data is required for submission");
  }
  
  // More thorough validation with specific error messages
  const requiredFields = ['make', 'model', 'vin', 'year'];
  const missingFields = requiredFields.filter(field => !valuationData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required valuation fields: ${missingFields.join(', ')}`);
  }
  
  // Ensure we have a valid mileage using the improved validation function
  const mileage = validateMileageData();
  console.log('Validated mileage:', mileage);

  // Calculate base price (average of min and med prices if available, or fall back to valuation/averagePrice)
  let priceX;
  if (valuationData.priceRanges?.minPrice !== undefined && valuationData.priceRanges?.medPrice !== undefined) {
    const priceMin = valuationData.priceRanges.minPrice;
    const priceMed = valuationData.priceRanges.medPrice;
    priceX = (priceMin + priceMed) / 2;
    console.log(`Calculated priceX from price ranges: ${priceX}`);
  } else {
    const price = valuationData.valuation || valuationData.averagePrice || 0;
    priceX = price;
    console.log(`Using direct valuation as priceX: ${priceX}`);
  }
  
  // Calculate reserve price using the server function with client fallback
  let reservePrice;
  try {
    reservePrice = await calculateReservePrice(priceX);
    console.log(`Calculated reserve price: ${reservePrice}`);
  } catch (error) {
    console.error('Failed to calculate reserve price:', error);
    throw new Error('Failed to calculate reserve price. Please try again.');
  }

  // Build the car data object - Include both name and seller_name fields
  // for maximum compatibility with all database function versions
  const carData = {
    id: carId,
    seller_id: userId,
    title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
    make: valuationData.make,
    model: valuationData.model,
    year: valuationData.year,
    vin: valuationData.vin,
    mileage: mileage,
    price: valuationData.valuation || valuationData.averagePrice || 0,
    reserve_price: reservePrice,
    transmission: valuationData.transmission,
    valuation_data: valuationData,
    is_draft: false,
    // Store seller contact info in appropriate fields with both mappings
    name: data.name, // For compatibility with older code
    seller_name: data.name, // For compatibility with database schema
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
    number_of_keys: parseInt(data.numberOfKeys),
    additional_photos: data.uploadedPhotos
  };

  // Validate against schema before submitting
  const schemaIssues = await validateFormSchema(carData, 'cars');
  if (schemaIssues.length > 0) {
    console.warn('Schema validation issues detected:', schemaIssues);
    // We don't throw here as this is a development-only check
    // and we want the submission to proceed in production
  }

  console.log('Car data prepared successfully');
  return carData;
};
