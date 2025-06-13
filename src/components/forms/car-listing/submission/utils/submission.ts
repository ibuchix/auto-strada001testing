
/**
 * Form submission utility functions  
 * Updated: 2025-05-30 - Phase 4: Fixed features data preservation and File object handling
 * Updated: 2025-06-13 - Removed leatherSeats references to fix compilation errors
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
  'price' // Explicitly exclude any price field
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
 * Properly handle features data - ensure it's preserved correctly
 */
const processFeatures = (features: any): CarFeatures => {
  // Default features structure - removed leatherSeats
  const defaultFeatures: CarFeatures = {
    airConditioning: false,
    bluetooth: false,
    cruiseControl: false,
    navigation: false,
    parkingSensors: false,
    sunroof: false,
    satNav: false,
    panoramicRoof: false,
    reverseCamera: false,
    heatedSeats: false,
    upgradedSound: false,
    alloyWheels: false,
  };
  
  if (!features || typeof features !== 'object') {
    console.warn('Features data is missing or invalid, using defaults');
    return defaultFeatures;
  }
  
  // Process each feature, ensuring boolean values - removed leatherSeats
  const processedFeatures: CarFeatures = {
    airConditioning: Boolean(features.airConditioning),
    bluetooth: Boolean(features.bluetooth),
    cruiseControl: Boolean(features.cruiseControl),
    navigation: Boolean(features.navigation),
    parkingSensors: Boolean(features.parkingSensors),
    sunroof: Boolean(features.sunroof),
    satNav: Boolean(features.satNav),
    panoramicRoof: Boolean(features.panoramicRoof),
    reverseCamera: Boolean(features.reverseCamera),
    heatedSeats: Boolean(features.heatedSeats),
    upgradedSound: Boolean(features.upgradedSound),
    alloyWheels: Boolean(features.alloyWheels),
  };
  
  console.log('Processed features data:', {
    original: features,
    processed: processedFeatures,
    trueFeatures: Object.entries(processedFeatures).filter(([, value]) => value).map(([key]) => key)
  });
  
  return processedFeatures;
};

/**
 * Transforms form data into database entity
 * Updated: Phase 4 - Fixed features processing and File object handling
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  console.log('Preparing submission with form data:', {
    hasFeatures: !!formData.features,
    featuresKeys: formData.features ? Object.keys(formData.features) : [],
    hasRequiredPhotos: !!formData.requiredPhotos,
    requiredPhotosTypes: formData.requiredPhotos ? Object.keys(formData.requiredPhotos) : []
  });
  
  // Process features properly
  const carFeatures = processFeatures(formData.features);
  
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
  
  // Preserve valuation data with proper structure
  const preservedValuationData = preserveValuationData(formData.valuationData);
  
  // Extract reserve price
  const extractedReservePrice = formData.reservePrice || 
                               formData.valuationData?.reservePrice || 
                               formData.valuationData?.reserve_price || 
                               formData.valuationData?.valuation || 
                               null;
  
  // Validate that we have a valid reserve price
  if (!extractedReservePrice || extractedReservePrice <= 0) {
    throw new Error('Reserve price must be greater than 0. Cannot create listing without valid reserve price.');
  }
  
  console.log('Preparing submission with features and reserve price:', {
    extractedReservePrice,
    carFeatures,
    preservedValuationData: !!preservedValuationData,
    featuresCount: Object.values(carFeatures).filter(Boolean).length
  });
  
  // Prepare entity
  const baseEntity: Partial<CarEntity> = {
    ...cleanedData,
    // Only include id if valid (for editing)
    ...(formData.id ? { id: formData.id } : {}),
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status: 'available',
    // Ensure required fields
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    reserve_price: extractedReservePrice,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    transmission: transmissionValue,
    features: carFeatures, // Use processed features
    valuation_data: preservedValuationData
  };
  
  // Convert to snake_case for database (but preserve valuation_data structure)
  const entity = transformObjectToSnakeCase(baseEntity) as Partial<CarEntity>;
  
  // Restore the camelCase valuation_data and ensure features are preserved
  if (preservedValuationData) {
    entity.valuation_data = preservedValuationData;
  }
  
  // Ensure features are properly set
  entity.features = carFeatures;
  
  console.log("Prepared entity with features:", {
    ...entity,
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none',
    features_summary: Object.entries(entity.features || {}).filter(([, value]) => value).map(([key]) => key),
    has_id: !!formData.id,
    status: entity.status,
    reserve_price: entity.reserve_price,
    valuation_data_structure: entity.valuation_data ? Object.keys(entity.valuation_data) : 'none'
  });
  
  return entity;
};
