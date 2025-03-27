
/**
 * Changes made:
 * - Created validation helpers for car listing form
 * - Added VIN validation with proper regex
 * - Added comprehensive form validation with multiple checks
 */

import { CarListingFormData } from "@/types/forms";

/**
 * Validates a Vehicle Identification Number (VIN).
 * A valid VIN must be 17 characters and only contain letters (except I, O, Q) and numbers.
 * 
 * @param vin - The VIN to validate
 * @returns True if the VIN is valid, false otherwise
 */
export const validateVIN = (vin: string): boolean => {
  // The regex excludes the letters I, O, and Q which are not used in VINs to avoid confusion
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin);
};

/**
 * Validates if a car form has the minimum required data.
 * 
 * @param formData - The car listing form data to validate
 * @returns True if the form data meets basic requirements, false otherwise
 */
export const validateCarForm = (formData: CarListingFormData): boolean => {
  return (
    validateVIN(formData.vin) &&
    formData.uploadedPhotos.length >= 1 &&
    formData.price > 0 &&
    formData.year >= 1886
  );
};

/**
 * Performs detailed validation of car listing form data and returns any validation errors.
 * 
 * @param formData - The car listing form data to validate
 * @returns An array of validation errors, empty if the form is valid
 */
export const getCarFormValidationErrors = (formData: CarListingFormData): string[] => {
  const errors: string[] = [];
  
  // Required fields validation
  if (!formData.make) errors.push("Car make is required");
  if (!formData.model) errors.push("Car model is required");
  
  // VIN validation
  if (!formData.vin) {
    errors.push("VIN is required");
  } else if (!validateVIN(formData.vin)) {
    errors.push("Invalid VIN format - must be 17 characters");
  }
  
  // Year validation
  if (!formData.year) {
    errors.push("Year is required");
  } else if (formData.year < 1886) {
    errors.push("Year must be 1886 or later");
  } else if (formData.year > new Date().getFullYear() + 1) {
    errors.push(`Year cannot be later than ${new Date().getFullYear() + 1}`);
  }
  
  // Price validation
  if (formData.price <= 0) {
    errors.push("Price must be greater than 0");
  }
  
  // Mileage validation
  if (formData.mileage < 0) {
    errors.push("Mileage cannot be negative");
  }
  
  // Photo validation
  if (!formData.uploadedPhotos || formData.uploadedPhotos.length === 0) {
    errors.push("At least one photo is required");
  }
  
  // Damage reports validation
  if (formData.isDamaged && (!formData.damageReports || formData.damageReports.length === 0)) {
    errors.push("Damage reports are required when car is marked as damaged");
  }
  
  return errors;
};

/**
 * Calculates the reserve price based on the car's price (PriceX).
 * Uses the calculation formula: PriceX - (PriceX * PercentageY)
 * 
 * @param price - The car's price (PriceX)
 * @returns The calculated reserve price
 */
export const calculateReservePrice = (price: number): number => {
  // Define the percentage tiers
  const percentageTiers = [
    { min: 0, max: 15000, percentage: 0.65 },
    { min: 15001, max: 20000, percentage: 0.46 },
    { min: 20001, max: 30000, percentage: 0.37 },
    { min: 30001, max: 50000, percentage: 0.27 },
    { min: 50001, max: 60000, percentage: 0.27 },
    { min: 60001, max: 70000, percentage: 0.22 },
    { min: 70001, max: 80000, percentage: 0.23 },
    { min: 80001, max: 100000, percentage: 0.24 },
    { min: 100001, max: 130000, percentage: 0.20 },
    { min: 130001, max: 160000, percentage: 0.185 },
    { min: 160001, max: 200000, percentage: 0.22 },
    { min: 200001, max: 250000, percentage: 0.17 },
    { min: 250001, max: 300000, percentage: 0.18 },
    { min: 300001, max: 400000, percentage: 0.18 },
    { min: 400001, max: 500000, percentage: 0.16 },
    { min: 500001, max: Infinity, percentage: 0.145 }
  ];
  
  // Find the applicable percentage tier
  const tier = percentageTiers.find(tier => price >= tier.min && price <= tier.max);
  const percentage = tier ? tier.percentage : 0.145; // Default to 14.5% if no tier found
  
  // Calculate reserve price: PriceX - (PriceX * PercentageY)
  const reservePrice = price - (price * percentage);
  
  // Round to nearest whole number
  return Math.round(reservePrice);
};
