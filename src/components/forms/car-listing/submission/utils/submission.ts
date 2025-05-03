
/**
 * Form submission utilities
 * Created: 2025-07-23
 */

import { CarListingFormData } from "@/types/forms";

export const prepareSubmission = (formData: CarListingFormData, userId: string): CarListingFormData => {
  return {
    ...formData,
    seller_id: userId,
    updated_at: new Date().toISOString(),
    created_at: formData.created_at ? new Date(formData.created_at).toISOString() : new Date().toISOString(),
    status: formData.id ? 'pending' : 'draft',
    is_draft: false
  };
};

/**
 * Calculates the reserve price based on the base price
 * @param basePrice - The base price of the car
 * @returns The calculated reserve price
 */
export const calculateReservePrice = (basePrice: number): number => {
  if (!basePrice) return 0;
  
  let percentageY = 0;
  
  if (basePrice <= 15000) {
    percentageY = 0.65;
  } else if (basePrice <= 20000) {
    percentageY = 0.46;
  } else if (basePrice <= 30000) {
    percentageY = 0.37;
  } else if (basePrice <= 50000) {
    percentageY = 0.27;
  } else if (basePrice <= 60000) {
    percentageY = 0.27;
  } else if (basePrice <= 70000) {
    percentageY = 0.22;
  } else if (basePrice <= 80000) {
    percentageY = 0.23;
  } else if (basePrice <= 100000) {
    percentageY = 0.24;
  } else if (basePrice <= 130000) {
    percentageY = 0.20;
  } else if (basePrice <= 160000) {
    percentageY = 0.185;
  } else if (basePrice <= 200000) {
    percentageY = 0.22;
  } else if (basePrice <= 250000) {
    percentageY = 0.17;
  } else if (basePrice <= 300000) {
    percentageY = 0.18;
  } else if (basePrice <= 400000) {
    percentageY = 0.18;
  } else if (basePrice <= 500000) {
    percentageY = 0.16;
  } else {
    percentageY = 0.145;
  }
  
  return basePrice - (basePrice * percentageY);
};

/**
 * Update missing field values to ensure form completeness
 * @param formData Current form data
 * @returns Updated form data with defaults applied where needed
 */
export const applyDefaults = (formData: CarListingFormData): CarListingFormData => {
  // Create a copy to avoid mutating original
  const data = { ...formData };
  
  // Set reserve price if not set but price is available
  if (data.price && !data.reserve_price) {
    data.reserve_price = calculateReservePrice(data.price);
  }
  
  // Ensure required arrays exist
  if (!data.uploadedPhotos) data.uploadedPhotos = [];
  if (!data.damageReports) data.damageReports = [];
  
  return data;
};
