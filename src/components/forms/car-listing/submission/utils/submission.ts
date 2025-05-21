
/**
 * Changes made:
 * - 2025-08-19: Updated to use toStringValue utility function
 * - Fixed type conversion issues
 * - 2025-08-20: Fixed type compatibility with string | number fields
 * - 2025-08-25: Added prepareSubmission function to transform form data to database entity
 * - 2025-12-03: Fixed type issues with required fields in CarEntity
 * - 2025-12-05: Enhanced prepareSubmission to properly handle CarFeatures
 * - 2025-06-21: Fixed references to CarFeatures interface and created_at handling
 * - 2025-07-22: Fixed incomplete implementation
 * - 2025-05-05: Fixed type issues and removed is_draft property 
 * - 2025-05-06: Fixed Date to string conversion issue
 * - 2025-06-01: Fixed transmission type to be one of the allowed values
 * - 2025-06-07: Enhanced transmission validation to ensure valid type
 * - 2025-07-25: Fixed database errors by filtering photo fields that should be in required_photos
 * - 2025-05-21: Added field name conversion from camelCase to snake_case to fix database schema compatibility
 * - 2025-05-21: Added exclusion of frontend-only fields like fromValuation
 * - 2025-05-22: Added finance-related fields to frontend-only fields list
 * - 2025-05-23: Added isSellingOnBehalf to frontend-only fields list to fix database schema error
 * - 2025-05-24: Added comprehensive list of frontend-only fields to prevent database schema errors
 * - 2025-05-28: Added 'name' to frontend-only fields list and mapped name to sellerName if not set
 * - 2025-05-30: Added both 'last_saved' and 'lastSaved' to frontend-only fields list to fix submission error
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";
import { PHOTO_FIELD_MAP } from "@/utils/photoMapping";
import { transformObjectToSnakeCase } from "@/utils/dataTransformers";

// Helper function to ensure transmission is a valid value
const validateTransmission = (value: unknown): "manual" | "automatic" | "semi-automatic" => {
  if (value === "automatic" || value === "semi-automatic" || value === "manual") {
    return value;
  }
  // Default to manual if invalid value provided
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
    // Use toStringValue to ensure proper type conversion
    financeAmount: toNumberValue(data.financeAmount),
  };
};

export const prepareFormDataForApi = (data: CarListingFormData) => {
  return {
    ...data,
    // Use toStringValue to ensure proper type conversion
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
  'hasOutstandingFinance',   // Finance-related frontend field
  'financeProvider',         // Finance-related frontend field
  'financeEndDate',          // Finance-related frontend field
  'financeDocument',         // Finance-related frontend field
  'isSellingOnBehalf',       // Seller relationship frontend field
  'hasWarningLights',        // Warning lights frontend field
  'warningLightPhotos',      // Warning lights photos frontend field
  'warningLightDescription', // Warning lights description frontend field
  'contactEmail',            // Contact information frontend field
  'conditionRating',         // Vehicle condition frontend field
  'damagePhotos',            // Damage photos array frontend field
  'damageReports',           // Damage reports array frontend field
  'uploadedPhotos',          // Temporary photo tracking frontend field
  'vehiclePhotos',           // Vehicle photos object frontend field
  'mainPhoto',               // Main photo selection frontend field
  'requiredPhotosComplete',  // Photo upload tracking frontend field
  'serviceHistoryCount',     // Service history count frontend field
  'rimPhotos',               // Rim photos storage frontend field
  'formProgress',            // Form progress tracking frontend field
  'formMetadata',            // Form metadata for UI frontend field
  'step',                    // Form step tracking frontend field
  'tempFiles',               // Temporary file storage frontend field
  'lastSaved',               // Last saved timestamp frontend field (camelCase)
  'last_saved',              // Last saved timestamp frontend field (snake_case)
  'name'                     // Form field 'name' not in database schema
];

/**
 * Transforms form data into a database entity by removing transient properties
 * and adding required database fields
 * 
 * @param formData The form data to transform
 * @returns A CarEntity object ready for database submission
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
  
  // Prepare base entity with all fields properly typed
  const baseEntity: Partial<CarEntity> = {
    ...cleanedData,
    id: formData.id || '',
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status: 'draft',
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
    // Limit display of photo data for cleaner logs
    required_photos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos || {}).length} photos]` : 'none'
  });
  
  return entity;
};

