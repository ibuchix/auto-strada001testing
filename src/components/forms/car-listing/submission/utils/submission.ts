
/**
 * Form submission utility functions  
 * Updated: 2025-05-24 - COMPLETELY REMOVED ALL DRAFT LOGIC - All submissions are immediately available
 * Updated: 2025-05-24 - ENHANCED valuation data preservation to fix reserve price display issues
 * Updated: 2025-05-24 - Ensured both reserve_price and valuation_data are properly stored
 * Updated: 2025-05-24 - Fixed naming convention consistency for valuation data
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
  'name'
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
  
  // Remove frontend-only fields
  FRONTEND_ONLY_FIELDS.forEach(key => {
    if (key in cleanedData) {
      delete (cleanedData as any)[key];
    }
  });
  
  // CRITICAL: Preserve valuation data with proper structure
  const preservedValuationData = preserveValuationData(formData.valuationData);
  
  // Extract reserve price for the database column
  const extractedReservePrice = formData.reservePrice || 
                               formData.valuationData?.reservePrice || 
                               formData.valuationData?.reserve_price || 
                               formData.valuationData?.valuation || 
                               null;
  
  console.log('Preparing submission with valuation data:', {
    originalReservePrice: formData.reservePrice,
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
    is_draft: false, // NEVER draft
    // Ensure required fields
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    price: formData.price || 0,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    transmission: transmissionValue,
    features: carFeatures,
    // CRITICAL: Store both reserve_price column and complete valuation_data
    reserve_price: extractedReservePrice,
    valuation_data: preservedValuationData // Keep in camelCase for consistency
  };
  
  // Convert to snake_case for database (but preserve valuation_data structure)
  const entity = transformObjectToSnakeCase(baseEntity) as Partial<CarEntity>;
  
  // Restore the camelCase valuation_data after transformation
  if (preservedValuationData) {
    entity.valuation_data = preservedValuationData;
  }
  
  console.log("Prepared entity with preserved valuation data:", {
    ...entity,
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none',
    has_id: !!formData.id,
    status: entity.status,
    is_draft: entity.is_draft,
    reserve_price: entity.reserve_price,
    valuation_data_structure: entity.valuation_data ? Object.keys(entity.valuation_data) : 'none'
  });
  
  return entity;
};
