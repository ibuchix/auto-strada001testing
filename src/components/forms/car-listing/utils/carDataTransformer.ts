
/**
 * Car Data Transformer Utilities
 * Updated: 2025-06-22 - Fixed property access to match CarListingFormData structure
 */

import { CarListingFormData, CarFeatures } from "@/types/forms";

/**
 * Transforms car listing data from API/DB format to form format
 */
export const transformCarDataToFormData = (carData: any): CarListingFormData => {
  // Handle potential missing fields
  if (!carData) return {} as CarListingFormData;

  // Basic car data
  const formData: CarListingFormData = {
    id: carData.id,
    make: carData.make || '',
    model: carData.model || '',
    year: carData.year || new Date().getFullYear(),
    mileage: carData.mileage || 0,
    price: carData.price || 0,
    vin: carData.vin || '',
    transmission: carData.transmission || 'manual',
    reserve_price: carData.reserve_price,
    
    // Features and options
    features: parseFeatures(carData.features),
    isDamaged: carData.is_damaged || false,
    isRegisteredInPoland: carData.is_registered_in_poland || false,
    hasPrivatePlate: carData.has_private_plate || false,
    hasFinance: carData.has_finance || false,
    hasServiceHistory: carData.has_service_history || false,
    serviceHistoryType: carData.service_history_type || 'none',
    
    // Personal details
    name: carData.seller_name || '',
    address: carData.address || '',
    mobileNumber: carData.mobile_number || '',
    seller_id: carData.seller_id,
    
    // Additional fields
    sellerNotes: carData.seller_notes || '',
    title: carData.title || '',
    seatMaterial: carData.seat_material || 'cloth',
    numberOfKeys: carData.number_of_keys?.toString() || '1',
    
    // Photo related fields
    vehiclePhotos: carData.vehicle_photos || {},
    uploadedPhotos: carData.uploaded_photos || [],
    rimPhotos: carData.rim_photos || {},
    damagePhotos: carData.damage_photos || [],
    
    // Metadata and progress
    form_metadata: carData.form_metadata || {
      currentStep: 0,
      completedSteps: [],
      validatedSections: []
    },
    
    // Timestamps
    created_at: carData.created_at,
    updated_at: carData.updated_at
  };
  
  return formData;
};

/**
 * Parse features from string or object to a features object
 */
const parseFeatures = (features: any): Record<string, boolean> => {
  if (!features) return {};
  
  if (typeof features === 'string') {
    try {
      return JSON.parse(features);
    } catch (e) {
      return {};
    }
  }
  
  return features as Record<string, boolean>;
};
