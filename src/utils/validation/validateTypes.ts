
/**
 * Changes made:
 * - 2025-05-01: Completely refactored to use centralized data extraction utilities
 * - 2025-05-01: Removed all fallback price estimation - now requires valid API data
 * - 2025-05-01: Stricter validation - no more guessing or estimation
 */

import { TransmissionType } from "@/components/hero/valuation/types";
import { extractValue, validators, hasRequiredProperties } from "@/utils/extraction/dataExtractor";

interface ValidationResult {
  normalizedData: any;
  hasError: boolean;
  shouldShowError: boolean;
  hasValuation: boolean;
}

/**
 * Normalize gearbox/transmission to standard values
 */
export function normalizeTransmission(transmission: string | undefined): TransmissionType {
  if (!transmission) return 'manual';
  
  const normalizedTransmission = transmission.toLowerCase().trim();
  return normalizedTransmission === 'automatic' ? 'automatic' : 'manual';
}

/**
 * Validates and normalizes valuation data from API response
 * Now uses centralized extraction utilities and removes fallback mechanisms
 */
export function validateValuationData(data: any): ValidationResult {
  if (!data) {
    console.warn('Validation called with empty data');
    return {
      normalizedData: {},
      hasError: true,
      shouldShowError: true,
      hasValuation: false
    };
  }
  
  console.log('Validating data structure:', {
    hasNestedResponse: !!data.functionResponse,
    topLevelKeys: Object.keys(data)
  });
  
  // Extract vehicle data with multiple possible paths
  const make = extractValue(data, [
    'make',
    'data.make',
    'functionResponse.userParams.make'
  ], '', validators.isString);
  
  const model = extractValue(data, [
    'model',
    'data.model',
    'functionResponse.userParams.model'
  ], '', validators.isString);
  
  const year = extractValue(data, [
    'year',
    'data.year',
    'functionResponse.userParams.year',
    'functionResponse.userParams.productionYear'
  ], 0, validators.isYear);
  
  const vin = extractValue(data, ['vin', 'data.vin'], '', validators.isString);
  
  // Extract price data with multiple possible paths
  const priceMin = extractValue(data, [
    'price_min',
    'data.price_min',
    'functionResponse.valuation.calcValuation.price_min'
  ], 0, validators.isPositiveNumber);
  
  const priceMed = extractValue(data, [
    'price_med',
    'data.price_med',
    'functionResponse.valuation.calcValuation.price_med'
  ], 0, validators.isPositiveNumber);
  
  // Try to get direct valuation/price values if min/med aren't available
  const directPrice = extractValue(data, [
    'valuation',
    'basePrice',
    'data.valuation',
    'data.basePrice',
    'functionResponse.valuation.calcValuation.price',
    'price'
  ], 0, validators.isPositiveNumber);
  
  // Calculate basePrice only if we have valid price data
  let basePrice = 0;
  if (priceMin > 0 && priceMed > 0) {
    basePrice = (priceMin + priceMed) / 2;
  } else if (directPrice > 0) {
    basePrice = directPrice;
  }
  
  // Get reservePrice if available or calculate it from basePrice
  const directReservePrice = extractValue(data, [
    'reservePrice',
    'data.reservePrice'
  ], 0, validators.isPositiveNumber);
  
  const reservePrice = directReservePrice > 0 ? directReservePrice : 
    (basePrice > 0 ? calculateReservePrice(basePrice) : 0);
  
  // Get averagePrice (usually the median price)
  const averagePrice = extractValue(data, [
    'averagePrice',
    'data.averagePrice',
    'price_med',
    'data.price_med',
    'functionResponse.valuation.calcValuation.price_med'
  ], priceMed || basePrice, validators.isNumber);
  
  // Extract error information
  const error = extractValue(data, [
    'error',
    'data.error',
    'functionResponse.error'
  ], '');
  
  const noData = extractValue(data, ['noData', 'data.noData'], false);
  
  // Construct normalized data object with all extracted values
  const normalizedData = {
    make,
    model,
    year,
    vin,
    transmission: normalizeTransmission(data.transmission),
    mileage: extractValue(data, ['mileage', 'data.mileage'], 0, validators.isNumber),
    valuation: basePrice,
    reservePrice,
    averagePrice,
    basePrice,
    error,
    noData,
    apiSource: extractValue(data, ['apiSource', 'data.apiSource'], 'auto_iso'),
    errorDetails: extractValue(data, ['errorDetails', 'data.errorDetails'], '')
  };
  
  // Determine if we have required data for a valid valuation
  const hasRequiredVehicleData = hasRequiredProperties(normalizedData, ['make', 'model', 'year']);
  const hasRequiredPriceData = normalizedData.basePrice > 0 && normalizedData.reservePrice > 0;
  
  const hasValuation = hasRequiredVehicleData && hasRequiredPriceData;
  
  // Determine if there's an error or if we should show an error
  const hasError = !!error || !!noData || !hasValuation;
  
  // Show error if essential data is missing or there's an explicit error
  const shouldShowError = hasError;
  
  console.log('Validation result:', {
    hasRequiredVehicleData,
    hasRequiredPriceData,
    hasValuation,
    hasError,
    shouldShowError,
    make,
    model,
    year,
    basePrice,
    reservePrice
  });
  
  return {
    normalizedData,
    hasError,
    shouldShowError,
    hasValuation
  };
}

/**
 * Calculate reserve price based on base price
 */
function calculateReservePrice(basePrice: number): number {
  // Determine percentage based on price tier
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
  
  // Calculate and round to nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}
