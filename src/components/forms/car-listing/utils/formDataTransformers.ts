/**
 * Form Data Transformers
 * Created: 2025-06-21
 * Updated: 2025-06-22 - Fixed type conversions and field mappings
 * Added: 2025-06-23 - Added missing transformDbToFormData function
 * Updated: 2025-08-24 - Added explicit mapping for damagePhotos to additional_photos
 * Updated: 2025-05-04 - Removed has_finance field, using finance_amount to determine if there's finance
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Transform form data to database record structure
 */
export const transformFormToDbRecord = (formData: CarListingFormData): Record<string, any> => {
  return {
    // Basic car details
    id: formData.id,
    make: formData.make,
    model: formData.model,
    year: Number(formData.year),
    mileage: Number(formData.mileage),
    vin: formData.vin,
    price: Number(formData.price),
    reserve_price: Number(formData.reserve_price || 0),
    transmission: formData.transmission || 'manual',
    
    // Features and options
    features: formData.features,
    is_damaged: !!formData.isDamaged,
    is_registered_in_poland: !!formData.isRegisteredInPoland,
    has_private_plate: !!formData.hasPrivatePlate,
    finance_amount: formData.financeAmount ? Number(formData.financeAmount) : null,
    has_service_history: !!formData.hasServiceHistory,
    service_history_type: formData.serviceHistoryType,
    
    // Photo data
    vehicle_photos: formData.vehiclePhotos,
    uploaded_photos: formData.uploadedPhotos || [],
    rim_photos: formData.rimPhotos,
    // additional_photos is handled in FormSubmitHandler to merge rimPhotos and damagePhotos
    
    // Seller details
    seller_id: formData.seller_id,
    seller_notes: formData.sellerNotes,
    
    // Additional details
    seat_material: formData.seatMaterial,
    number_of_keys: Number(formData.numberOfKeys || 1),
    
    // Timestamps
    created_at: formData.created_at,
    updated_at: new Date().toISOString(),
    
    // Metadata
    status: 'draft',
    form_metadata: formData.form_metadata
  };
};

/**
 * Transform database record to form data structure
 */
export const transformDbRecordToForm = (dbRecord: Record<string, any>): CarListingFormData => {
  if (!dbRecord) return {} as CarListingFormData;
  
  return {
    // Basic car details
    id: dbRecord.id,
    make: dbRecord.make || '',
    model: dbRecord.model || '',
    year: Number(dbRecord.year || new Date().getFullYear()),
    mileage: Number(dbRecord.mileage || 0),
    vin: dbRecord.vin || '',
    price: Number(dbRecord.price || 0),
    reserve_price: Number(dbRecord.reserve_price || 0),
    transmission: dbRecord.transmission || 'manual',
    
    // Features and options
    features: dbRecord.features || {},
    isDamaged: !!dbRecord.is_damaged,
    isRegisteredInPoland: !!dbRecord.is_registered_in_poland,
    hasPrivatePlate: !!dbRecord.has_private_plate,
    hasServiceHistory: !!dbRecord.has_service_history,
    serviceHistoryType: dbRecord.service_history_type || 'none',
    
    // Set hasOutstandingFinance based on finance_amount
    hasOutstandingFinance: dbRecord.finance_amount !== null && dbRecord.finance_amount > 0,
    financeAmount: dbRecord.finance_amount,
    
    // Photo data
    vehiclePhotos: dbRecord.vehicle_photos || {},
    uploadedPhotos: dbRecord.uploaded_photos || [],
    rimPhotos: dbRecord.rim_photos || {},
    
    // Extract damage photos from additional_photos
    damagePhotos: extractPhotosOfType(dbRecord.additional_photos || [], 'damage_photo'),
    
    // Seller details
    seller_id: dbRecord.seller_id,
    sellerNotes: dbRecord.seller_notes || '',
    name: dbRecord.seller_name || '',
    address: dbRecord.address || '',
    mobileNumber: dbRecord.mobile_number || '',
    
    // Additional details
    seatMaterial: dbRecord.seat_material || 'cloth',
    numberOfKeys: String(dbRecord.number_of_keys || 1),
    
    // Timestamps
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    
    // Metadata
    form_metadata: dbRecord.form_metadata || {}
  };
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
  // Create a copy to avoid modifying the original
  const data = { ...formData };
  
  // Convert boolean values
  const booleanFields = {
    isDamaged: 'is_damaged',
    isRegisteredInPoland: 'is_registered_in_poland',
    hasPrivatePlate: 'has_private_plate',
    hasServiceHistory: 'has_service_history',
  };
  
  const result: Record<string, any> = {
    // Core fields
    id: data.id,
    make: data.make,
    model: data.model,
    year: Number(data.year),
    mileage: Number(data.mileage),
    vin: data.vin,
    price: Number(data.price),
    reserve_price: Number(data.reserve_price || 0),
    transmission: data.transmission,
    
    // Boolean fields - convert from isDamaged to is_damaged etc.
    ...Object.entries(booleanFields).reduce((acc, [formField, dbField]) => {
      acc[dbField] = !!data[formField as keyof CarListingFormData];
      return acc;
    }, {} as Record<string, boolean>),
    
    // Finance handling - use finance_amount instead of has_finance
    finance_amount: data.financeAmount ? Number(data.financeAmount) : null,
    
    // Other fields
    features: data.features,
    service_history_type: data.serviceHistoryType,
    service_history_files: data.serviceHistoryFiles,
    seller_notes: data.sellerNotes,
    
    // Personal details
    seller_id: data.seller_id,
    seller_name: data.name,
    address: data.address,
    mobile_number: data.mobileNumber,
    
    // Photos
    vehicle_photos: data.vehiclePhotos,
    uploaded_photos: data.uploadedPhotos,
    // rimPhotos and damagePhotos will be handled separately
    
    // Additional details
    seat_material: data.seatMaterial,
    number_of_keys: Number(data.numberOfKeys || 1),
    
    // Timestamps
    created_at: data.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Status and metadata
    status: 'draft',
    is_draft: true,
    form_metadata: data.form_metadata
  };
  
  return result;
};

/**
 * Transform database record to form data structure
 */
export const transformDbToFormData = (dbData: any): any => {
  // If there's no data, return null
  if (!dbData) return null;
  
  // Map database fields to form data fields
  return {
    // Basic information
    id: dbData.id,
    make: dbData.make,
    model: dbData.model,
    year: Number(dbData.year),
    mileage: Number(dbData.mileage),
    vin: dbData.vin,
    price: Number(dbData.price),
    reserve_price: Number(dbData.reserve_price),
    transmission: dbData.transmission || 'manual',
    
    // Seller details
    name: dbData.seller_name || '',
    address: dbData.address || '',
    mobileNumber: dbData.mobile_number || '',
    
    // Vehicle status
    isDamaged: Boolean(dbData.is_damaged),
    isRegisteredInPoland: Boolean(dbData.is_registered_in_poland),
    hasPrivatePlate: Boolean(dbData.has_private_plate),
    
    // Features and options
    features: dbData.features || {},
    serviceHistoryType: dbData.service_history_type,
    sellerNotes: dbData.seller_notes || '',
    seatMaterial: dbData.seat_material || '',
    numberOfKeys: Number(dbData.number_of_keys || 1),
    
    // Financial details
    hasOutstandingFinance: dbData.finance_amount !== null && dbData.finance_amount > 0,
    financeAmount: dbData.finance_amount ? Number(dbData.finance_amount) : null,
    
    // Status flags
    is_draft: Boolean(dbData.is_draft),
    status: dbData.status || 'pending',
    
    // Photo information
    requiredPhotos: dbData.required_photos || {},
    // Extract damage photos from additional_photos if exists
    damagePhotos: extractPhotosOfType(dbData.additional_photos || [], 'damage_photo'),
    
    // Timestamps
    created_at: dbData.created_at || new Date().toISOString(),
    updated_at: dbData.updated_at || new Date().toISOString(),
    
    // Form metadata
    form_metadata: dbData.form_metadata || {
      lastUpdatedStep: 0,
      completedSteps: [],
      visitedSteps: []
    }
  };
};
