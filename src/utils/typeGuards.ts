/**
 * Changes made:
 * - Added missing CarFeatures properties (bluetooth, sunroof, alloyWheels)
 * - Added isCarEntity type guard for API endpoint validation
 * - Added additional utility functions for type checking
 * - 2025-05-10: Updated getDefaultCarFeatures to include all required properties
 * - 2025-05-10: Fixed instanceof check in isCarEntity function
 * - Updated: 2025-05-29 - Updated type guards to use reservePrice instead of removed price field
 */

import { CarFeatures, CarEntity, CarListingFormData } from "@/types/forms";

export const isCarFeatures = (obj: unknown): obj is CarFeatures => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const features = obj as Record<string, unknown>;
  return (
    typeof features.satNav === 'boolean' &&
    typeof features.panoramicRoof === 'boolean' &&
    typeof features.reverseCamera === 'boolean' &&
    typeof features.heatedSeats === 'boolean' &&
    typeof features.upgradedSound === 'boolean' &&
    typeof features.bluetooth === 'boolean' &&
    typeof features.sunroof === 'boolean' &&
    typeof features.alloyWheels === 'boolean' &&
    typeof features.airConditioning === 'boolean' &&
    typeof features.cruiseControl === 'boolean' &&
    typeof features.leatherSeats === 'boolean' &&
    typeof features.navigation === 'boolean' &&
    typeof features.parkingSensors === 'boolean'
  );
};

export const getDefaultCarFeatures = (): CarFeatures => ({
  satNav: false,
  panoramicRoof: false,
  reverseCamera: false,
  heatedSeats: false,
  upgradedSound: false,
  bluetooth: false,
  sunroof: false,
  alloyWheels: false,
  airConditioning: false,
  cruiseControl: false,
  leatherSeats: false,
  navigation: false,
  parkingSensors: false
});

/**
 * Type guard to check if an object is a valid CarEntity from the API
 * @param data The data to check
 * @returns Boolean indicating if the data is a valid CarEntity
 */
export const isCarEntity = (data: unknown): data is CarEntity => {
  if (typeof data !== 'object' || data === null) return false;
  
  const car = data as Partial<CarEntity>;
  
  return (
    typeof car.id === 'string' &&
    typeof car.created_at === 'string' &&
    typeof car.make === 'string' &&
    typeof car.model === 'string' &&
    typeof car.year === 'number' &&
    typeof car.reserve_price === 'number' &&
    typeof car.mileage === 'number' &&
    typeof car.vin === 'string'
  );
};

/**
 * Type guard to check if an array of items are all valid CarEntities
 * @param data Array to check
 * @returns Boolean indicating if all items are valid CarEntities
 */
export const isCarEntityArray = (data: unknown): data is CarEntity[] => {
  return Array.isArray(data) && data.every(item => isCarEntity(item));
};

/**
 * Checks if a car form is valid enough to be submitted
 * @param formData The form data to validate
 * @returns Boolean indicating if the form meets minimum requirements for submission
 */
export const isSubmittableCarForm = (formData: unknown): formData is CarListingFormData => {
  if (typeof formData !== 'object' || formData === null) return false;
  
  const form = formData as Partial<CarListingFormData>;
  
  return (
    typeof form.make === 'string' && form.make.trim() !== '' &&
    typeof form.model === 'string' && form.model.trim() !== '' &&
    typeof form.year === 'number' && form.year >= 1886 &&
    typeof form.reservePrice === 'number' && form.reservePrice >= 0 &&
    typeof form.mileage === 'number' && form.mileage >= 0 &&
    typeof form.vin === 'string' && form.vin.trim().length === 17 &&
    Array.isArray(form.uploadedPhotos) && form.uploadedPhotos.length >= 1
  );
};

export const isValidCarEntity = (data: any): data is Partial<CarEntity> => {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data.reserve_price === undefined || typeof data.reserve_price === 'number') &&
    (data.make === undefined || typeof data.make === 'string') &&
    (data.model === undefined || typeof data.model === 'string')
  );
};

export const isValidCarListingFormData = (data: any): data is Partial<CarListingFormData> => {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data.reservePrice === undefined || (typeof data.reservePrice === 'number' && data.reservePrice >= 0)) &&
    (data.make === undefined || typeof data.make === 'string') &&
    (data.model === undefined || typeof data.model === 'string')
  );
};
