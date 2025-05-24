
/**
 * Form submission utility functions  
 * Updated: 2025-05-24 - COMPLETELY REMOVED ALL DRAFT LOGIC - All submissions are immediately available
 * Updated: 2025-05-24 - Simplified with direct photo storage
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
    features: carFeatures
  };
  
  // Convert to snake_case for database
  const entity = transformObjectToSnakeCase(baseEntity) as Partial<CarEntity>;
  
  console.log("Prepared entity (IMMEDIATE AVAILABLE):", {
    ...entity,
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none',
    has_id: !!formData.id,
    status: entity.status,
    is_draft: entity.is_draft
  });
  
  return entity;
};
