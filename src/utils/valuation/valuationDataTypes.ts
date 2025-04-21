
/**
 * Type definitions for valuation data
 * Updated: 2025-04-22 - Added more complete type definitions
 * Updated: 2025-04-22 - Added ValuationResult interface for consistent data handling
 * Updated: 2025-04-24 - Added apiSource, errorDetails, and usingFallbackEstimation properties
 */

export type TransmissionType = 'manual' | 'automatic';

export interface ValuationData {
  vin: string;
  make: string;
  model: string;
  year: number;
  transmission: TransmissionType;
  mileage: number;
  valuation: number;
  reservePrice: number;
  averagePrice: number;
  basePrice: number;
  
  // Metadata
  apiSource?: string;
  valuationDate?: string;
  errorDetails?: string;
  usingFallbackEstimation?: boolean;
  
  // Status flags
  error?: string;
  noData?: boolean;
  isExisting?: boolean;
}

export interface ValuationApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * ValuationResult interface for consistent return types
 * Used to provide normalized valuation data with status flags
 */
export interface ValuationResult {
  normalizedData: ValuationData;
  hasError: boolean;
  shouldShowError: boolean;
  hasValuation: boolean;
  hasPricingData: boolean;
}

/**
 * Calculate the reserve price based on base price
 * Uses the official pricing tiers and percentages
 */
export function calculateReservePrice(basePrice: number): number {
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}
