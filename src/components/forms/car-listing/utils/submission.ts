
/**
 * Form submission utility functions
 * Updated: 2025-06-15 - Enforce use of reserve price directly from valuation, remove all fallback calculations.
 * Updated: 2025-05-24 - COMPLETELY REMOVED DRAFT LOGIC - All submissions are immediately available
 * Updated: 2025-05-29 - REMOVED price field - using only reservePrice
 * Updated: 2025-06-13 - Removed leatherSeats references to fix compilation errors
 */

import { CarListingFormData, CarEntity, CarFeatures } from "@/types/forms";

// Helper function to ensure transmission is a valid value
const validateTransmission = (value: unknown): "manual" | "automatic" | "semi-automatic" => {
  if (value === "automatic" || value === "semi-automatic" || value === "manual") {
    return value;
  }
  return "manual";
};

// Helper functions for type conversion
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

/**
 * Transforms form data into a database entity using only the reserve price from valuation.
 * Updated: 2025-06-15 - No fallback: must use reservePrice from valuation as the single source of truth.
 */
export const prepareSubmission = (formData: CarListingFormData): Partial<CarEntity> => {
  // Ensure features property has all required fields
  const carFeatures: CarFeatures = {
    airConditioning: formData.features?.airConditioning || false,
    bluetooth: formData.features?.bluetooth || false,
    cruiseControl: formData.features?.cruiseControl || false,
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

  // Ensure transmission is a valid type
  const transmissionValue = validateTransmission(formData.transmission);

  // STRICT: Extract reserve price only from valuation data or the field directly set from valuation
  let finalReservePrice: number | null = null;
  if (formData.valuationData && typeof formData.valuationData.reservePrice === 'number') {
    finalReservePrice = formData.valuationData.reservePrice;
  } else if (typeof formData.reservePrice === 'number') {
    finalReservePrice = formData.reservePrice;
  }

  if (!finalReservePrice || finalReservePrice <= 0) {
    // No valid reserve price from valuation—do not allow submission
    throw new Error('Reserve price must be provided by valuation. Please re-do your valuation before submitting.');
  }

  // Build the entity object
  const entity: Partial<CarEntity> = {
    ...formData,
    id: formData.id || '',
    created_at: createdAt,
    updated_at: new Date().toISOString(),
    status: 'available', // ALWAYS available
    is_draft: false, // NEVER draft
    make: formData.make || '',
    model: formData.model || '',
    year: formData.year || 0,
    reserve_price: finalReservePrice,
    mileage: formData.mileage || 0,
    vin: formData.vin || '',
    transmission: transmissionValue,
    features: carFeatures
  };

  return entity;
};
