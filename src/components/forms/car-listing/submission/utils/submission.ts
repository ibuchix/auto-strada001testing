
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
 * - 2025-05-19: Updated to include required_photos in CarEntity
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";
import { toStringValue, toNumberValue } from "@/utils/typeConversion";
import { consolidatePhotoFields } from "./photoProcessor";

export const prepareFormDataForSubmission = (data: CarListingFormData) => {
  // First consolidate photo fields to prevent schema errors
  const { updatedFormData } = consolidatePhotoFields(data);
  
  return {
    ...updatedFormData,
    // Ensure financeAmount is consistently a number or null
    financeAmount: updatedFormData.financeAmount !== undefined && updatedFormData.financeAmount !== null ? 
      Number(updatedFormData.financeAmount) : null,
  };
};

export const prepareFormDataForApi = (data: CarListingFormData) => {
  // Use the same photo consolidation for API calls
  const { updatedFormData } = consolidatePhotoFields(data);
  
  return {
    ...updatedFormData,
    // Ensure financeAmount is consistently a number or null
    financeAmount: updatedFormData.financeAmount !== undefined && updatedFormData.financeAmount !== null ? 
      Number(updatedFormData.financeAmount) : null,
  };
};

/**
 * Transforms form data into a database entity by removing transient properties
 * and adding required database fields
 * 
 * @param formData The form data to transform
 * @returns A CarEntity object ready for database submission
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  // Process photo fields to match database schema expectations
  const { updatedFormData, requiredPhotos } = consolidatePhotoFields(formData);
  
  // Ensure features property has all required fields
  const carFeatures: CarFeatures = {
    airConditioning: updatedFormData.features?.airConditioning || false,
    bluetooth: updatedFormData.features?.bluetooth || false,
    cruiseControl: updatedFormData.features?.cruiseControl || false,
    leatherSeats: updatedFormData.features?.leatherSeats || false,
    navigation: updatedFormData.features?.navigation || false,
    parkingSensors: updatedFormData.features?.parkingSensors || false,
    sunroof: updatedFormData.features?.sunroof || false,
    satNav: updatedFormData.features?.satNav || false,
    panoramicRoof: updatedFormData.features?.panoramicRoof || false,
    reverseCamera: updatedFormData.features?.reverseCamera || false,
    heatedSeats: updatedFormData.features?.heatedSeats || false,
    upgradedSound: updatedFormData.features?.upgradedSound || false,
    alloyWheels: updatedFormData.features?.alloyWheels || false,
  };
  
  // Ensure all required fields are present with default values if needed
  const entity: Partial<CarEntity> = {
    ...updatedFormData,
    id: updatedFormData.id || '',
    created_at: updatedFormData.created_at ? new Date(updatedFormData.created_at).toISOString() : new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: 'draft',
    // Ensure required fields have values
    make: updatedFormData.make || '',
    model: updatedFormData.model || '',
    year: updatedFormData.year || 0,
    price: updatedFormData.price || 0,
    mileage: updatedFormData.mileage || 0,
    vin: updatedFormData.vin || '',
    // Cast transmission to the expected type
    transmission: updatedFormData.transmission || 'manual',
    // Use properly typed features
    features: carFeatures,
    // Ensure financeAmount is a number or null
    financeAmount: updatedFormData.financeAmount !== undefined && updatedFormData.financeAmount !== null ? 
      Number(updatedFormData.financeAmount) : null,
    // Add the consolidated required_photos field
    required_photos: requiredPhotos
  };
  
  return entity;
};
