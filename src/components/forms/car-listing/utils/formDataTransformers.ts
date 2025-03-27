/**
 * Changes made:
 * - 2024-03-20: Fixed type references to match database schema
 * - 2024-03-20: Updated property names to match database schema
 * - 2024-03-19: Added support for converting between form and database formats
 * - 2024-03-19: Added handling for default values and nullable fields
 * - 2024-03-25: Added support for additional_photos field
 * - 2024-08-08: Added support for form_metadata with current_step
 * - 2024-08-09: Fixed type handling for form_metadata field
 * - 2024-12-05: Added error handling for localStorage data access
 * - 2024-12-06: Fixed type errors with valuationData properties
 * - 2024-08-04: Fixed "name" column issue by using seller_name instead
 * - 2025-05-31: Standardized field naming approach by providing both name and seller_name
 * - 2025-06-01: Removed references to non-existent field has_tool_pack
 * - 2025-06-02: Removed references to non-existent field has_documentation
 * - 2025-06-10: Added schema validation to catch field mismatches
 * - 2025-06-15: Removed defaultCarFeatures dependency
 * - 2025-06-15: Removed references to non-existent field is_selling_on_behalf
 * - 2025-06-16: Added field existence checking to avoid database errors
 * - 2025-08-19: Updated to use toStringValue utility function
 * - Fixed type conversion issues
 */

import { CarListingFormData } from "@/types/forms";
import { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { filterObjectByAllowedFields } from "@/utils/dataTransformers";
import { toStringValue } from "@/utils/typeConversion";

// Default car features definition
const defaultCarFeatures = {
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false
};

// List of known valid car table fields for safer data transformation
const VALID_CAR_FIELDS = [
  'seller_id',
  'name',
  'seller_name',
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
  'form_metadata',
  'make',
  'model',
  'year',
  'valuation_data'
];

// Cache for database schema to avoid repeated queries
let dbSchemaCache: {[table: string]: string[]} = {};

/**
 * Dynamically fetch table column names from the database
 * This is a more reliable way to check field existence
 */
const getTableColumns = async (tableName: string): Promise<string[]> => {
  // Return from cache if available
  if (dbSchemaCache[tableName]) {
    return dbSchemaCache[tableName];
  }
  
  try {
    const { data, error } = await supabase.rpc('get_table_columns', {
      p_table_name: tableName
    });
    
    if (error) {
      console.error('Error fetching table columns:', error);
      return VALID_CAR_FIELDS; // Fallback to hardcoded fields
    }
    
    // Extract column names from the result
    const columnNames = data.map(col => col.column_name);
    
    // Cache the result
    dbSchemaCache[tableName] = columnNames;
    
    return columnNames;
  } catch (error) {
    console.error('Error in getTableColumns:', error);
    return VALID_CAR_FIELDS; // Fallback to hardcoded fields
  }
};

export const transformFormToDbData = async (formData: CarListingFormData, userId: string): Promise<any> => {
  // Safely retrieve data from localStorage with fallbacks
  let valuationData: Record<string, any> = {};
  let mileage = 0;
  let vin = '';
  let currentStep = 0;
  
  try {
    const valuationDataStr = localStorage.getItem('valuationData');
    valuationData = valuationDataStr ? JSON.parse(valuationDataStr) : {};
    
    mileage = parseInt(localStorage.getItem('tempMileage') || '0');
    vin = localStorage.getItem('tempVIN') || '';
    currentStep = parseInt(localStorage.getItem('formCurrentStep') || '0');
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Create basic form data even if localStorage data is missing
  const title = valuationData && 
    typeof valuationData === 'object' && 
    'make' in valuationData && 
    'model' in valuationData && 
    'year' in valuationData
      ? `${valuationData.make || ''} ${valuationData.model || ''} ${valuationData.year || ''}`.trim()
      : 'Draft Listing';
  
  // Safely extract price from valuation data, handling undefined/missing values
  const price = valuationData && typeof valuationData === 'object' 
    ? ('valuation' in valuationData && valuationData.valuation !== undefined && valuationData.valuation !== null
        ? valuationData.valuation 
        : ('averagePrice' in valuationData && valuationData.averagePrice !== undefined && valuationData.averagePrice !== null
            ? valuationData.averagePrice 
            : 0)) 
    : 0;

  // Create initial data object with all possible fields
  const initialData = {
    seller_id: userId,
    // Include both name and seller_name fields for maximum compatibility
    name: formData.name, // For compatibility with code expecting name field
    seller_name: formData.name, // For consistency with database schema
    address: formData.address,
    mobile_number: formData.mobileNumber,
    features: formData.features as unknown as Json,
    is_damaged: formData.isDamaged,
    is_registered_in_poland: formData.isRegisteredInPoland,
    // REMOVED: is_selling_on_behalf field - it doesn't exist in database
    has_private_plate: formData.hasPrivatePlate,
    finance_amount: formData.financeAmount ? parseFloat(formData.financeAmount) : null,
    service_history_type: formData.serviceHistoryType,
    seller_notes: formData.sellerNotes,
    seat_material: formData.seatMaterial,
    number_of_keys: parseInt(formData.numberOfKeys),
    is_draft: true,
    last_saved: new Date().toISOString(),
    mileage: mileage,
    price: price,
    title: title,
    vin: vin,
    transmission: formData.transmission,
    additional_photos: formData.uploadedPhotos || [],
    form_metadata: {
      current_step: currentStep,
      last_updated: new Date().toISOString()
    } as Json
  };

  try {
    // Dynamically get actual database columns - this is safer than hardcoded lists
    const dbColumns = await getTableColumns('cars');
    
    // Filter data to only include fields that exist in the database
    const filteredData = filterObjectByAllowedFields(initialData, dbColumns);
    
    console.log('Filtered data for database compatibility', filteredData);
    
    return filteredData;
  } catch (error) {
    console.error('Error filtering data:', error);
    
    // Fallback to hardcoded list if dynamic check fails
    return filterObjectByAllowedFields(initialData, VALID_CAR_FIELDS);
  }
};

export const transformDbToFormData = (dbData: any): Partial<CarListingFormData> => {
  // Safely handle form_metadata
  const metadata = dbData.form_metadata as Record<string, any> | null;
  if (metadata && typeof metadata === 'object' && 'current_step' in metadata) {
    try {
      localStorage.setItem('formCurrentStep', String(metadata.current_step));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }
  
  return {
    // Map seller_name to name for form data, with fallback to name field
    name: dbData.seller_name || dbData.name || "",
    address: dbData.address || "",
    mobileNumber: dbData.mobile_number || "",
    features: dbData.features ? { ...defaultCarFeatures, ...dbData.features as Record<string, boolean> } : defaultCarFeatures,
    isDamaged: dbData.is_damaged || false,
    isRegisteredInPoland: dbData.is_registered_in_poland || false,
    // REMOVED: isSellingOnBehalf field - not in database
    hasPrivatePlate: dbData.has_private_plate || false,
    financeAmount: toStringValue(dbData.finance_amount),
    serviceHistoryType: dbData.service_history_type || "none",
    sellerNotes: dbData.seller_notes || "",
    seatMaterial: dbData.seat_material || "",
    numberOfKeys: dbData.number_of_keys?.toString() || "1",
    transmission: dbData.transmission as "manual" | "automatic" | null,
    uploadedPhotos: dbData.additional_photos || []
  };
};

export const transformFormData = (data: CarListingFormData) => {
  return {
    name: data.name,
    address: data.address,
    mobileNumber: data.mobileNumber,
    features: data.features,
    isDamaged: data.isDamaged,
    isRegisteredInPoland: data.isRegisteredInPoland,
    hasPrivatePlate: data.hasPrivatePlate,
    financeAmount: toStringValue(data.financeAmount),
    serviceHistoryType: data.serviceHistoryType,
    sellerNotes: data.sellerNotes,
    seatMaterial: data.seatMaterial,
    numberOfKeys: data.numberOfKeys,
    transmission: data.transmission,
    uploadedPhotos: data.uploadedPhotos
  };
};
