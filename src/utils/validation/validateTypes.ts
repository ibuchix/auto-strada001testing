
/**
 * Changes made:
 * - 2025-05-03: Completely removed all fallback price estimation mechanisms
 * - 2025-05-03: Stricter validation - requiring valid API data for all pricing fields
 * - 2025-05-03: Enhanced error detection for missing/invalid price data
 * - 2025-05-03: Improved logging for better debugging of data extraction issues
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
 * Uses centralized extraction utilities and requires valid API data
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
  
  // Extract pricing data from API response (no fallbacks)
  const reservePrice = extractValue(data, [
    'reservePrice',
    'data.reservePrice'
  ], 0, validators.isPositiveNumber);
  
  const averagePrice = extractValue(data, [
    'averagePrice',
    'data.averagePrice',
    'price_med',
    'data.price_med',
    'functionResponse.valuation.calcValuation.price_med'
  ], 0, validators.isNumber);
  
  // Try to extract pricing data from nested API structure
  const priceMin = extractValue(data, [
    'price_min', 
    'data.price_min',
    'functionResponse.valuation.calcValuation.price_min'
  ], 0, validators.isNumber);
  
  const priceMed = extractValue(data, [
    'price_med',
    'data.price_med', 
    'functionResponse.valuation.calcValuation.price_med'
  ], 0, validators.isNumber);
  
  // Log extracted price data for debugging
  console.log('Extracted price data:', {
    reservePrice,
    averagePrice,
    priceMin,
    priceMed,
    hasValidReservePrice: reservePrice > 0,
    hasValidAvgPrice: averagePrice > 0,
    hasValidPrices: priceMin > 0 && priceMed > 0
  });
  
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
    valuation: reservePrice, // Use reserve price as valuation
    reservePrice,
    averagePrice,
    error,
    noData,
    apiSource: extractValue(data, ['apiSource', 'data.apiSource'], 'auto_iso'),
    errorDetails: extractValue(data, ['errorDetails', 'data.errorDetails'], '')
  };
  
  // Determine if we have required data for a valid valuation
  // NO FALLBACKS: We require actual data from the API
  const hasRequiredVehicleData = hasRequiredProperties(normalizedData, ['make', 'model', 'year']);
  const hasRequiredPriceData = reservePrice > 0;
  
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
    reservePrice
  });
  
  return {
    normalizedData,
    hasError,
    shouldShowError,
    hasValuation
  };
}
