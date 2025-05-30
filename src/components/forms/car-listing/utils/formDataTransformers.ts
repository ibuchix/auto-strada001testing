
/**
 * Form Data Transformation Utilities
 * Updated: 2025-05-29 - COMPLETELY REMOVED price field - using only reservePrice
 * Updated: 2025-05-30 - Fixed TypeScript errors with field mappings and type assignments
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Transform form data from camelCase (frontend) to snake_case (database)
 * COMPLETELY REMOVED price field references
 */
export const transformToSnakeCase = (formData: CarListingFormData): Record<string, any> => {
  const transformed: Record<string, any> = {};
  
  // Handle specific field mappings
  const fieldMappings: Record<string, string> = {
    // Basic car info
    'make': 'make',
    'model': 'model',
    'year': 'year',
    'mileage': 'mileage',
    'vin': 'vin',
    'transmission': 'transmission',
    'title': 'title',
    
    // ONLY reserve price field
    'reservePrice': 'reserve_price',
    
    // Seller info
    'sellerName': 'seller_name',
    'address': 'address',
    'mobileNumber': 'mobile_number',
    
    // Car condition
    'isDamaged': 'is_damaged',
    'isRegisteredInPoland': 'is_registered_in_poland',
    'hasPrivatePlate': 'has_private_plate',
    'hasServiceHistory': 'has_service_history',
    
    // Finance
    'financeAmount': 'finance_amount',
    
    // Service history
    'serviceHistoryType': 'service_history_type',
    
    // Additional details
    'sellerNotes': 'seller_notes',
    'seatMaterial': 'seat_material',
    'numberOfKeys': 'number_of_keys',
    
    // Metadata - Fixed: use created_at instead of createdAt
    'created_at': 'created_at',
    'updatedAt': 'updated_at',
    'lastSaved': 'last_saved',
    
    // Complex fields (keep as-is)
    'features': 'features',
    'requiredPhotos': 'required_photos',
    'additionalPhotos': 'additional_photos',
    'valuationData': 'valuation_data',
    'formMetadata': 'form_metadata'
  };
  
  // Transform known fields
  Object.entries(fieldMappings).forEach(([camelKey, snakeKey]) => {
    if (formData[camelKey as keyof CarListingFormData] !== undefined) {
      transformed[snakeKey] = formData[camelKey as keyof CarListingFormData];
    }
  });
  
  // Ensure no price field exists
  if ('price' in transformed) {
    delete transformed.price;
    console.warn('Removed price field from transformed data - using only reserve_price');
  }
  
  console.log('Transform result (price field check):', {
    hasReservePrice: 'reserve_price' in transformed,
    hasPriceField: 'price' in transformed,
    reservePriceValue: transformed.reserve_price
  });
  
  return transformed;
};

/**
 * Transform database data from snake_case to camelCase (frontend)
 */
export const transformToCamelCase = (dbData: Record<string, any>): Partial<CarListingFormData> => {
  const transformed: Partial<CarListingFormData> = {};
  
  // Reverse field mappings - Fixed: use proper keyof CarListingFormData types
  const fieldMappings: Record<string, keyof CarListingFormData> = {
    // Basic car info
    'make': 'make',
    'model': 'model',
    'year': 'year',
    'mileage': 'mileage',
    'vin': 'vin',
    'transmission': 'transmission',
    'title': 'title',
    
    // ONLY reserve price field
    'reserve_price': 'reservePrice',
    
    // Seller info
    'seller_name': 'sellerName',
    'address': 'address',
    'mobile_number': 'mobileNumber',
    
    // Car condition
    'is_damaged': 'isDamaged',
    'is_registered_in_poland': 'isRegisteredInPoland',
    'has_private_plate': 'hasPrivatePlate',
    'has_service_history': 'hasServiceHistory',
    
    // Finance
    'finance_amount': 'financeAmount',
    
    // Service history
    'service_history_type': 'serviceHistoryType',
    
    // Additional details
    'seller_notes': 'sellerNotes',
    'seat_material': 'seatMaterial',
    'number_of_keys': 'numberOfKeys',
    
    // Metadata - Fixed: map to created_at which exists in CarListingFormData
    'created_at': 'created_at',
    'updated_at': 'updatedAt',
    'last_saved': 'lastSaved',
    
    // Complex fields
    'features': 'features',
    'required_photos': 'requiredPhotos',
    'additional_photos': 'additionalPhotos',
    'valuation_data': 'valuationData',
    'form_metadata': 'formMetadata'
  };
  
  // Transform known fields
  Object.entries(fieldMappings).forEach(([snakeKey, camelKey]) => {
    if (dbData[snakeKey] !== undefined) {
      transformed[camelKey] = dbData[snakeKey];
    }
  });
  
  // Handle any legacy price field by converting to reservePrice
  if (dbData.price !== undefined && !transformed.reservePrice) {
    transformed.reservePrice = dbData.price;
    console.warn('Converted legacy price field to reservePrice');
  }
  
  return transformed;
};
