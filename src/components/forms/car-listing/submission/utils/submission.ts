
/**
 * Form submission utility functions  
 * Updated: 2025-05-24 - COMPLETELY REMOVED DRAFT LOGIC - All submissions are immediately available
 * Updated: 2025-05-24 - Simplified photo processing with direct storage
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";
import { PHOTO_FIELD_MAP } from "@/utils/photoMapping";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";
import { toSupabaseObject } from "@/utils/supabaseTypeUtils";

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

// List of photo field names that should not be included in the top-level database object
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

// List of frontend-only fields that shouldn't be sent to the database
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
 * Transforms form data into a database entity - ALWAYS immediately available
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  // Ensure features property has all required fields
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
  
  // Convert Date to string if needed
  const createdAt = typeof formData.created_at === 'string' 
    ? formData.created_at 
    : formData.created_at instanceof Date 
      ? formData.created_at.toISOString() 
      : new Date().toISOString();
  
  // Ensure transmission is one of the allowed types
  const transmissionValue = validateTransmission(formData.transmission);
  
  // Create a clean copy of form data without photo fields that belong in required_photos
  const cleanedData = { ...formData };
  
  // If name is provided but sellerName is not, map name to sellerName
  if (cleanedData.name && !cleanedData.sellerName) {
    cleanedData.sellerName = cleanedData.name;
  }
  
  // Remove photo fields from top level object as they should be in required_photos
  PHOTO_FIELD_KEYS.forEach(key => {
    if (key in cleanedData) {
      delete (cleanedData as any)[key];
    }
  });
  
  // Remove frontend-only fields from the data being sent to the database
  FRONTEND_ONLY_FIELDS.forEach(key => {
    if (key in cleanedData) {
      delete (cleanedData as any)[key];
    }
  });
  
  // Prepare base entity with all fields properly typed - ALWAYS AVAILABLE
  const baseEntity: Partial<CarEntity> = {
    ...cleanedData,
    // Only include id if it's a valid non-empty value (for editing existing records)
    ...(formData.id ? { id: formData.id } : {}),
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status: 'available', // ALWAYS available
    is_draft: false, // NEVER draft
    // Ensure required fields have values
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    price: formData.price || 0,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    // Use validated transmission type
    transmission: transmissionValue,
    // Use properly typed features
    features: carFeatures
  };
  
  // Convert all camelCase field names to snake_case for database compatibility
  const entity = transformObjectToSnakeCase(baseEntity) as Partial<CarEntity>;
  
  // Log the cleaned entity for debugging
  console.log("Prepared entity for database submission:", {
    ...entity,
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none',
    has_id: !!formData.id,
    status: entity.status,
    is_draft: entity.is_draft
  });
  
  return entity;
};
