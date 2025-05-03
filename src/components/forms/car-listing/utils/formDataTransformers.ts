/**
 * Form Data Transformers
 * Created: 2025-06-21
 * Updated: 2025-06-22 - Fixed type conversions and field mappings
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
    has_finance: !!formData.hasFinance,
    has_service_history: !!formData.hasServiceHistory,
    service_history_type: formData.serviceHistoryType,
    
    // Photo data
    vehicle_photos: formData.vehiclePhotos,
    uploaded_photos: formData.uploadedPhotos || [],
    rim_photos: formData.rimPhotos,
    damage_photos: formData.damagePhotos,
    
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
    hasFinance: !!dbRecord.has_finance,
    hasServiceHistory: !!dbRecord.has_service_history,
    serviceHistoryType: dbRecord.service_history_type || 'none',
    
    // Photo data
    vehiclePhotos: dbRecord.vehicle_photos || {},
    uploadedPhotos: dbRecord.uploaded_photos || [],
    rimPhotos: dbRecord.rim_photos || {},
    damagePhotos: dbRecord.damage_photos || [],
    
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
    hasFinance: 'has_finance',
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
    rim_photos: data.rimPhotos,
    damage_photos: data.damagePhotos,
    
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
