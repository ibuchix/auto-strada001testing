
/**
 * Type definitions for valuation data
 * Updated: 2025-04-22 - Added more complete type definitions
 * Updated: 2025-04-22 - Added ValuationResult interface for consistent data handling
 * Updated: 2025-04-24 - Added apiSource, errorDetails, and usingFallbackEstimation properties
 * Updated: 2025-04-25 - Enhanced fallback estimation handling with better metadata
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
  estimationMethod?: string;
  
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
  // Log calculation for debugging
  console.log('[RESERVE CALC] Starting calculation with basePrice:', basePrice);
  
  // Validate base price - return 0 if invalid
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    console.error('[RESERVE CALC] Invalid base price:', basePrice);
    return 0;
  }
  
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
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  // Log detailed calculation for debugging
  console.log('[RESERVE CALC] Calculation details:', {
    basePrice,
    percentageRate: (percentage * 100).toFixed(1) + '%',
    formula: `${basePrice} - (${basePrice} × ${percentage})`,
    reservePrice
  });
  
  return reservePrice;
}

/**
 * Estimate a base price based on vehicle make and model
 * Used when proper valuation data isn't available from the API
 */
export function estimateBasePriceByModel(make: string, model: string, year: number): number {
  if (!make || !model) return 0;
  
  // Clean and normalize inputs
  const normalizedMake = make.trim().toUpperCase();
  const normalizedModel = model.trim().toUpperCase();
  const age = new Date().getFullYear() - year;
  
  console.log('[ESTIMATE] Estimating price for:', { normalizedMake, normalizedModel, year, age });
  
  // Base estimation tiers by age
  let baseEstimate = 50000; // Default mid-range value
  
  if (age <= 3) baseEstimate = 80000;
  else if (age <= 6) baseEstimate = 60000;
  else if (age <= 10) baseEstimate = 40000;
  else if (age <= 15) baseEstimate = 25000;
  else baseEstimate = 15000;
  
  // Premium make adjustments (very basic implementation)
  const premiumMakes = ['BMW', 'MERCEDES', 'AUDI', 'PORSCHE', 'LAND ROVER', 'JAGUAR', 'LEXUS'];
  const economyMakes = ['DACIA', 'FIAT', 'HYUNDAI', 'KIA', 'SKODA', 'SEAT'];
  
  if (premiumMakes.includes(normalizedMake)) {
    baseEstimate *= 1.4; // 40% premium
  } else if (economyMakes.includes(normalizedMake)) {
    baseEstimate *= 0.8; // 20% discount
  }
  
  // Calculate final price (rounded to nearest 1000)
  const estimatedPrice = Math.round(baseEstimate / 1000) * 1000;
  
  console.log('[ESTIMATE] Final estimated price:', estimatedPrice);
  return estimatedPrice;
}
