
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
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";
import { PHOTO_FIELD_MAP } from "@/utils/photoMapping";

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
  
  // Remove photo fields from top level object as they should be in required_photos
  PHOTO_FIELD_KEYS.forEach(key => {
    if (key in cleanedData) {
      delete (cleanedData as any)[key];
    }
  });
  
  // Ensure all required fields are present with default values if needed
  const entity: Partial<CarEntity> = {
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
  
  // Log the cleaned entity for debugging
  console.log("Prepared entity for database submission:", {
    ...entity,
    // Limit display of photo data for cleaner logs
    requiredPhotos: entity.required_photos ? 
      `[${Object.keys(entity.required_photos).length} photos]` : 'none'
  });
  
  return entity;
};
