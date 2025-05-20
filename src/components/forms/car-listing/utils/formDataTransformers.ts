
/**
 * Form Data Transformers
 * Created: 2025-06-21
 * Updated: 2025-06-22 - Fixed type conversions and field mappings
 * Added: 2025-06-23 - Added missing transformDbToFormData function
 * Updated: 2025-08-24 - Added explicit mapping for damagePhotos to additional_photos
 * Updated: 2025-05-04 - Removed has_finance field, using finance_amount to determine if there's finance
 * Updated: 2025-05-14 - Fixed financeAmount type handling to consistently use number
 * Updated: 2025-05-24 - Updated to convert between camelCase and snake_case at data boundaries
 */

import { CarListingFormData } from "@/types/forms";
import { transformObjectToCamelCase, transformObjectToSnakeCase } from "@/utils/dataTransformers";

/**
 * Transform form data to database record structure
 */
export const transformFormToDbRecord = (formData: CarListingFormData): Record<string, any> => {
  // Convert the whole object to snake_case for database compatibility
  const snakeCaseData = transformObjectToSnakeCase(formData);
  
  // Additional data transformations for specific fields
  return {
    ...snakeCaseData,
    // Ensure these numeric fields are properly typed
    year: Number(formData.year),
    mileage: Number(formData.mileage),
    price: Number(formData.price),
    reserve_price: Number(formData.reservePrice || 0),
    // Boolean fields need explicit conversion
    is_damaged: !!formData.isDamaged,
    is_registered_in_poland: !!formData.isRegisteredInPoland,
    has_private_plate: !!formData.hasPrivatePlate,
    has_service_history: !!formData.hasServiceHistory,
    // Updated_at should be current timestamp
    updated_at: new Date().toISOString(),
  };
};

/**
 * Transform database record to form data structure
 */
export const transformDbRecordToForm = (dbRecord: Record<string, any>): CarListingFormData => {
  if (!dbRecord) return {} as CarListingFormData;
  
  // Convert the database record to camelCase first
  const camelCaseData = transformObjectToCamelCase(dbRecord);
  
  // Override specific fields that need special handling
  return {
    ...camelCaseData,
    // Ensure hasOutstandingFinance is derived from financeAmount
    hasOutstandingFinance: dbRecord.finance_amount !== null && dbRecord.finance_amount > 0,
    // Extract damage photos from additional_photos if exists
    damagePhotos: extractPhotosOfType(dbRecord.additional_photos || [], 'damage_photo'),
  } as CarListingFormData;
};

/**
 * Helper function to extract photos of a specific type from additional_photos
 */
function extractPhotosOfType(additionalPhotos: any[], type: string): string[] {
  if (!Array.isArray(additionalPhotos)) return [];
  
  return additionalPhotos
    .filter(photo => {
      // Handle both object format and string format
      if (typeof photo === 'object' && photo !== null) {
        return photo.type === type;
      } else if (typeof photo === 'string') {
        return true; // Include all strings if no type info
      }
      return false;
    })
    .map(photo => typeof photo === 'object' && photo !== null ? photo.url : photo);
}

/**
 * Prepare form data for submission
 */
export const prepareFormDataForSubmission = (formData: CarListingFormData): Record<string, any> => {
  // Convert to snake_case for database submission
  const snakeCaseData = transformObjectToSnakeCase(formData);
  
  // Additional specific field transformations
  return {
    ...snakeCaseData,
    // Make sure numeric fields are properly typed
    year: Number(formData.year),
    mileage: Number(formData.mileage),
    price: Number(formData.price),
    reserve_price: Number(formData.reservePrice || 0),
    finance_amount: formData.financeAmount !== undefined && formData.financeAmount !== null ? 
      Number(formData.financeAmount) : null,
    number_of_keys: Number(formData.numberOfKeys || 1),
    
    // Boolean conversions
    is_damaged: !!formData.isDamaged,
    is_registered_in_poland: !!formData.isRegisteredInPoland,
    has_private_plate: !!formData.hasPrivatePlate,
    has_service_history: !!formData.hasServiceHistory,
    
    // Timestamps
    created_at: formData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Status
    status: 'draft',
    is_draft: true,
  };
};

/**
 * Transform database record to form data structure
 */
export const transformDbToFormData = (dbData: any): CarListingFormData => {
  // If there's no data, return empty object
  if (!dbData) return {} as CarListingFormData;
  
  // First convert all snake_case keys to camelCase
  const camelCaseData = transformObjectToCamelCase(dbData);
  
  // Then handle any specific field transformations
  return {
    ...camelCaseData,
    // Ensure boolean fields are properly typed
    isDamaged: !!dbData.is_damaged,
    isRegisteredInPoland: !!dbData.is_registered_in_poland,
    hasPrivatePlate: !!dbData.has_private_plate,
    // Set hasOutstandingFinance based on finance_amount
    hasOutstandingFinance: dbData.finance_amount !== null && dbData.finance_amount > 0,
    // Extract damage photos
    damagePhotos: extractPhotosOfType(dbData.additional_photos || [], 'damage_photo'),
  } as CarListingFormData;
};
