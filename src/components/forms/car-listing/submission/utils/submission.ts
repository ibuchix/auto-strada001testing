/**
 * Car Listing Submission Service - Updated to use selective transformation
 * Updated: 2025-06-13 - Implemented selective snake_case transformation to prevent JSON corruption
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";
import { PHOTO_FIELD_MAP } from "@/utils/photoMapping";

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

// Fields that should be protected from transformation (contain URLs, complex data, etc.)
const PROTECTED_FIELDS = new Set([
  'requiredPhotos',
  'required_photos',
  'additionalPhotos', 
  'additional_photos',
  'valuationData',
  'valuation_data',
  'features',
  'formMetadata',
  'form_metadata'
]);

// Simple field mappings for camelCase to snake_case (only for basic fields)
const FIELD_MAPPINGS: Record<string, string> = {
  'sellerName': 'seller_name',
  'mobileNumber': 'mobile_number',
  'reservePrice': 'reserve_price',
  'isDamaged': 'is_damaged',
  'isRegisteredInPoland': 'is_registered_in_poland',
  'hasPrivatePlate': 'has_private_plate',
  'financeAmount': 'finance_amount',
  'serviceHistoryType': 'service_history_type',
  'sellerNotes': 'seller_notes',
  'seatMaterial': 'seat_material',
  'numberOfKeys': 'number_of_keys',
  'updatedAt': 'updated_at',
  'createdAt': 'created_at'
};

/**
 * Selective transformation - only transforms specific field names, protects complex data
 */
const selectiveTransform = (data: any): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => selectiveTransform(item));
  }

  const result: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    // Check if this field should be protected from transformation
    if (PROTECTED_FIELDS.has(key)) {
      // Keep protected fields as-is (no transformation)
      result[key] = value;
      continue;
    }
    
    // Apply simple field mapping if it exists
    const mappedKey = FIELD_MAPPINGS[key] || key;
    
    // For non-protected fields, we can safely transform nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Only transform if it's not a protected field
      result[mappedKey] = selectiveTransform(value);
    } else {
      result[mappedKey] = value;
    }
  }
  
  return result;
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
 * Preserve valuation data in original format for consistency
 */
const preserveValuationData = (valuationData: any) => {
  if (!valuationData) return null;
  
  // Keep valuation data exactly as-is to prevent corruption
  console.log('Preserving valuation data without transformation:', {
    hasValuationData: !!valuationData,
    keys: valuationData ? Object.keys(valuationData) : []
  });
  
  return valuationData;
};

/**
 * Properly handle features data - ensure it's preserved correctly
 */
const processFeatures = (features: any): CarFeatures => {
  // Default features structure
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
  
  // Process each feature, ensuring boolean values
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

/**
 * Transforms form data into database entity using selective transformation
 * Updated: 2025-06-13 - Uses selective transformation to prevent JSON corruption
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  console.log('Preparing submission with selective transformation:', {
    hasFeatures: !!formData.features,
    featuresKeys: formData.features ? Object.keys(formData.features) : [],
    hasRequiredPhotos: !!formData.requiredPhotos,
    requiredPhotosTypes: formData.requiredPhotos ? Object.keys(formData.requiredPhotos) : [],
    hasValuationData: !!formData.valuationData
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
  
  console.log('Preparing submission with selective transformation:', {
    extractedReservePrice,
    carFeatures,
    preservedValuationData: !!preservedValuationData,
    featuresCount: Object.values(carFeatures).filter(Boolean).length
  });
  
  // Prepare entity with mixed field names (database will handle both)
  const baseEntity: Partial<CarEntity> = {
    ...cleanedData,
    // Only include id if valid (for editing)
    ...(formData.id ? { id: formData.id } : {}),
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status: 'available',
    // Ensure required fields with proper snake_case names for database
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    reserve_price: extractedReservePrice, // Use snake_case for database
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    transmission: transmissionValue,
    features: carFeatures, // Use processed features
    valuation_data: preservedValuationData, // Use snake_case for database
    // Map key fields to snake_case for database
    seller_name: formData.sellerName || formData.name || '',
    mobile_number: formData.mobileNumber || '',
    is_damaged: formData.isDamaged || false,
    is_registered_in_poland: formData.isRegisteredInPoland !== false,
    has_private_plate: formData.hasPrivatePlate || false,
    finance_amount: toNumberValue(formData.financeAmount),
    service_history_type: formData.serviceHistoryType || 'none',
    seller_notes: formData.sellerNotes || '',
    seat_material: formData.seatMaterial || 'cloth',
    number_of_keys: formData.numberOfKeys || 1
  };
  
  // Use selective transformation instead of aggressive transformObjectToSnakeCase
  const entity = selectiveTransform(baseEntity) as Partial<CarEntity>;
  
  // Ensure critical fields are preserved exactly
  if (preservedValuationData) {
    entity.valuation_data = preservedValuationData;
  }
  
  // Ensure features are properly set
  entity.features = carFeatures;
  
  console.log("Prepared entity with selective transformation:", {
    ...entity,
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none',
    features_summary: Object.entries(entity.features || {}).filter(([, value]) => value).map(([key]) => key),
    has_id: !!formData.id,
    status: entity.status,
    reserve_price: entity.reserve_price,
    valuation_data_structure: entity.valuation_data ? Object.keys(entity.valuation_data) : 'none',
    transformation_type: 'selective'
  });
  
  return entity;
};
