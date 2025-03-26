
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
 * - 2025-07-22: Improved error handling and added safeguards for field type mismatches
 * - 2025-07-24: Enhanced boolean field handling to ensure proper type conversion
 */

import { CarListingFormData } from "@/types/forms";
import { calculateReservePrice } from "./reservePriceCalculator";
import { supabase } from "@/integrations/supabase/client";
import { validateMileageData } from "./validationHandler";
import { validateFormSchema } from "@/utils/validation/schemaValidation";

/**
 * Safely converts values to appropriate types to avoid database casting errors
 */
const safeTypeConversion = (field: string, value: any): any => {
  // Return null for undefined/null values
  if (value === undefined || value === null) return null;
  
  // Handle special case for boolean fields - ensure proper boolean conversion
  if (field.startsWith('is_') || field.startsWith('has_')) {
    // Convert explicitly to boolean to avoid string/number conversion issues
    return value === true || value === 'true' || value === 1;
  }
  
  // Handle numeric fields
  if (field === 'mileage' || field === 'price' || field === 'reserve_price' || 
      field === 'finance_amount' || field === 'number_of_keys') {
    // If it's already a number, return it
    if (typeof value === 'number') return value;
    
    // If it's a string that can be converted to a number
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value);
    }
    
    // For empty strings or invalid numbers
    if (value === '') return null;
    
    // For other values, convert as best as possible or return null
    const num = Number(value);
    return isNaN(num) ? null : num;
  }
  
  // Default: return the value as is
  return value;
};

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

  // Build the car data object with explicit type conversion for all fields
  const carData = {
    id: carId,
    seller_id: userId,
    title: `${valuationData.make} ${valuationData.model} ${valuationData.year}`,
    make: valuationData.make,
    model: valuationData.model,
    year: safeTypeConversion('year', valuationData.year),
    vin: valuationData.vin,
    mileage: safeTypeConversion('mileage', mileage),
    price: safeTypeConversion('price', valuationData.valuation || valuationData.averagePrice || 0),
    reserve_price: safeTypeConversion('reserve_price', reservePrice),
    transmission: valuationData.transmission,
    valuation_data: valuationData,
    is_draft: safeTypeConversion('is_draft', false),
    // Store seller contact info in appropriate fields with both mappings
    name: data.name, // For compatibility with older code
    seller_name: data.name, // For compatibility with database schema
    address: data.address,
    mobile_number: data.mobileNumber,
    features: data.features,
    is_damaged: safeTypeConversion('is_damaged', data.isDamaged),
    is_registered_in_poland: safeTypeConversion('is_registered_in_poland', data.isRegisteredInPoland),
    is_selling_on_behalf: safeTypeConversion('is_selling_on_behalf', data.isSellingOnBehalf), 
    has_private_plate: safeTypeConversion('has_private_plate', data.hasPrivatePlate),
    finance_amount: safeTypeConversion('finance_amount', data.financeAmount),
    service_history_type: data.serviceHistoryType,
    seller_notes: data.sellerNotes,
    seat_material: data.seatMaterial,
    number_of_keys: safeTypeConversion('number_of_keys', data.numberOfKeys),
    additional_photos: data.uploadedPhotos
  };

  // Debug information to help track down issues
  console.log('Prepared car data:', {
    ...carData,
    valuation_data: '[omitted for log clarity]'
  });

  // Validate against schema before submitting - only in development
  try {
    const schemaIssues = await validateFormSchema(carData, 'cars');
    if (schemaIssues.length > 0) {
      console.warn('Schema validation issues detected:', schemaIssues);
    }
  } catch (error) {
    console.warn('Schema validation failed but continuing with submission:', error);
    // We don't throw here as this is a development-only check
    // and we want the submission to proceed in production
  }

  console.log('Car data prepared successfully');
  return carData;
};
