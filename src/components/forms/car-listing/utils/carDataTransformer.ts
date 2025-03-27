
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
 * - 2025-05-31: Standardized field mapping approach across all transformations
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field has_documentation
 * - 2025-06-15: Removed references to non-existent field is_selling_on_behalf
 * - 2025-06-16: Added dynamic field filtering to prevent database errors
 */

import { CarListingFormData } from "@/types/forms";
import { supabase } from "@/integrations/supabase/client";
import { filterObjectByAllowedFields } from "@/utils/dataTransformers";

// Cache for column names
let carColumnsCache: string[] | null = null;

// List of known valid car table fields as fallback
const KNOWN_CAR_FIELDS = [
  'seller_id',
  'seller_name',
  'name',
  'address',
  'mobile_number',
  'features',
  'is_damaged',
  'is_registered_in_poland',
  // 'is_selling_on_behalf' - removed as it doesn't exist in database
  'has_private_plate',
  'finance_amount',
  'service_history_type',
  'seller_notes',
  'seat_material',
  'number_of_keys',
  'is_draft',
  'last_saved',
  'mileage',
  'price',
  'title',
  'vin',
  'transmission',
  'additional_photos',
  'make',
  'model',
  'year',
  'valuation_data'
];

/**
 * Fetches and caches the actual column names from the cars table
 */
const getCarColumns = async (): Promise<string[]> => {
  // Return cached result if available
  if (carColumnsCache) {
    return carColumnsCache;
  }
  
  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      p_table_name: 'cars'
    });
    
    if (error) {
      console.error('Error fetching car table columns:', error);
      return KNOWN_CAR_FIELDS;
    }
    
    // Extract and cache column names
    carColumnsCache = data.map(col => col.column_name);
    return carColumnsCache;
  } catch (error) {
    console.error('Error in getCarColumns:', error);
    return KNOWN_CAR_FIELDS;
  }
};

export const prepareCarData = async (
  data: CarListingFormData,
  valuationData: any,
  userId: string
): Promise<any> => {
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

  // Create the initial car data object
  const carData = {
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
    // REMOVED: is_selling_on_behalf field - it doesn't exist in database
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

  try {
    // Get actual database columns
    const columns = await getCarColumns();
    
    // Filter the data to only include fields that exist in the database
    const filteredData = filterObjectByAllowedFields(carData, columns);
    
    console.log('Filtered car data for database compatibility:', {
      ...filteredData,
      valuation_data: '[omitted for log clarity]'
    });
    
    return filteredData;
  } catch (error) {
    console.error('Error filtering car data:', error);
    
    // Fallback to hardcoded field filtering
    return filterObjectByAllowedFields(carData, KNOWN_CAR_FIELDS);
  }
};
