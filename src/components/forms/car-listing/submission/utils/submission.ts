
/**
 * Form submission utility functions  
 * Updated: 2025-05-29 - COMPLETELY REMOVED price field - using only reserve_price
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";
import { PHOTO_FIELD_MAP } from "@/utils/photoMapping";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";

// Helper function to ensure transmission is a valid value
const validateTransmission = (value: unknown): "manual" | "automatic" | "semi-automatic" => {
  if (value === "automatic" || value === "semi-automatic" || value === "manual") {
    return value;
  }
  return "manual";
};

// Helper functions for type conversion
const toStringValue = (value: any): string => {
  if (value === undefined || value === null) return '';
  return String(value);
};

const toNumberValue = (value: any): number => {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const prepareFormDataForSubmission = (data: CarListingFormData) => {
  return {
    ...data,
    financeAmount: toNumberValue(data.financeAmount),
  };
};

export const prepareFormDataForApi = (data: CarListingFormData) => {
  return {
    ...data,
    financeAmount: toNumberValue(data.financeAmount),
  };
};

// Photo field keys that should not be in top-level database object
const PHOTO_FIELD_KEYS = [
  'frontView',
  'rearView', 
  'driverSide',
  'passengerSide',
  'dashboard',
  'interiorFront',
  'interiorRear',
  'odometer',
  'trunk',
  'engine',
  'wheel',
  'roof',
  ...Object.keys(PHOTO_FIELD_MAP)
];

// Frontend-only fields that shouldn't be sent to database
const FRONTEND_ONLY_FIELDS = [
  'fromValuation',
  'photoValidationPassed',
  'uploadInProgress',
  'uploadSuccess',
  'hasOutstandingFinance',
  'financeProvider',
  'financeEndDate',
  'financeDocument',
  'isSellingOnBehalf',
  'hasWarningLights',
  'warningLightPhotos',
  'warningLightDescription',
  'contactEmail',
  'conditionRating',
  'damagePhotos',
  'damageReports',
  'uploadedPhotos',
  'vehiclePhotos',
  'mainPhoto',
  'requiredPhotosComplete',
  'serviceHistoryCount',
  'rimPhotos',
  'formProgress',
  'formMetadata',
  'step',
  'tempFiles',
  'lastSaved',
  'last_saved',
  'name',
  'price' // REMOVED: Explicitly exclude any price field
];

/**
 * Preserve valuation data in original camelCase format for consistency
 */
const preserveValuationData = (valuationData: any) => {
  if (!valuationData) return null;
  
  // Ensure the valuation data maintains camelCase structure
  const preservedData = {
    ...valuationData,
    // Ensure reservePrice is present in camelCase
    reservePrice: valuationData.reservePrice || valuationData.reserve_price || valuationData.valuation
  };
  
  console.log('Preserving valuation data with camelCase structure:', {
    original: valuationData,
    preserved: preservedData,
    hasReservePrice: !!preservedData.reservePrice
  });
  
  return preservedData;
};

/**
 * Transforms form data into database entity - ALWAYS immediately available
 * Updated: Using ONLY reserve_price field (completely removed price column)
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  // Ensure features property exists
  const carFeatures: CarFeatures = {
    airConditioning: formData.features?.airConditioning || false,
    bluetooth: formData.features?.bluetooth || false,
    cruiseControl: formData.features?.cruiseControl || false,
    leatherSeats: formData.features?.leatherSeats || false,
    navigation: formData.features?.navigation || false,
    parkingSensors: formData.features?.parkingSensors || false,
    sunroof: formData.features?.sunroof || false,
    satNav: formData.features?.satNav || false,
    panoramicRoof: formData.features?.panoramicRoof || false,
    reverseCamera: formData.features?.reverseCamera || false,
    heatedSeats: formData.features?.heatedSeats || false,
    upgradedSound: formData.features?.upgradedSound || false,
    alloyWheels: formData.features?.alloyWheels || false,
  };
  
  // Handle date conversion
  const createdAt = typeof formData.created_at === 'string' 
    ? formData.created_at 
    : formData.created_at instanceof Date 
      ? formData.created_at.toISOString() 
      : new Date().toISOString();
  
  // Validate transmission
  const transmissionValue = validateTransmission(formData.transmission);
  
  // Clean form data
  const cleanedData = { ...formData };
  
  // Map name to sellerName if needed
  if (cleanedData.name && !cleanedData.sellerName) {
    cleanedData.sellerName = cleanedData.name;
  }
  
  // Remove photo fields that belong in required_photos
  PHOTO_FIELD_KEYS.forEach(key => {
    if (key in cleanedData) {
      delete (cleanedData as any)[key];
    }
  });
  
  // Remove frontend-only fields (including any price field)
  FRONTEND_ONLY_FIELDS.forEach(key => {
    if (key in cleanedData) {
      delete (cleanedData as any)[key];
    }
  });
  
  // CRITICAL: Preserve valuation data with proper structure
  const preservedValuationData = preserveValuationData(formData.valuationData);
  
  // Extract reserve price - ONLY source of truth
  const extractedReservePrice = formData.reservePrice || 
                               formData.valuationData?.reservePrice || 
                               formData.valuationData?.reserve_price || 
                               formData.valuationData?.valuation || 
                               null;
  
  // Validate that we have a valid reserve price
  if (!extractedReservePrice || extractedReservePrice <= 0) {
    throw new Error('Reserve price must be greater than 0. Cannot create listing without valid reserve price.');
  }
  
  console.log('Preparing submission with ONLY reserve_price:', {
    extractedReservePrice,
    preservedValuationData,
    hasValuationData: !!preservedValuationData
  });
  
  // Prepare entity - ALWAYS available, NEVER draft
  const baseEntity: Partial<CarEntity> = {
    ...cleanedData,
    // Only include id if valid (for editing)
    ...(formData.id ? { id: formData.id } : {}),
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status: 'available', // ALWAYS available
    // Ensure required fields
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    reserve_price: extractedReservePrice, // ONLY price field
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    transmission: transmissionValue,
    features: carFeatures,
    // CRITICAL: Store complete valuation_data
    valuation_data: preservedValuationData // Keep in camelCase for consistency
  };
  
  // Convert to snake_case for database (but preserve valuation_data structure)
  const entity = transformObjectToSnakeCase(baseEntity) as Partial<CarEntity>;
  
  // Restore the camelCase valuation_data after transformation
  if (preservedValuationData) {
    entity.valuation_data = preservedValuationData;
  }
  
  console.log("Prepared entity with ONLY reserve_price:", {
    ...entity,
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none',
    has_id: !!formData.id,
    status: entity.status,
    reserve_price: entity.reserve_price,
    valuation_data_structure: entity.valuation_data ? Object.keys(entity.valuation_data) : 'none',
    // VERIFY: No price field exists
    price_field_exists: 'price' in entity ? 'ERROR: price field still exists!' : 'OK: no price field'
  });
  
  return entity;
};
