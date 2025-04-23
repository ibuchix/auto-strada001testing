/**
 * Changes made:
 * - 2025-05-03: Updated to use new nested price extraction
 * - 2025-05-03: Removed all fallback price estimation
 * - 2025-04-23: Now uses dedicated pricePathExtractor utility
 */

import { TransmissionType } from "@/components/hero/valuation/types";
import { extractValue, validators } from "@/utils/extraction/dataExtractor";
import { extractNestedPriceData, calculateBasePriceFromNested } from "@/utils/extraction/pricePathExtractor";

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

  // Extract price data using our dedicated utility
  const priceData = extractNestedPriceData(data);
  
  // Extract vehicle data
  const make = extractValue(data, [
    'functionResponse.userParams.make',
    'make'
  ], '', validators.isString);
  
  const model = extractValue(data, [
    'functionResponse.userParams.model',
    'model'
  ], '', validators.isString);
  
  const year = extractValue(data, [
    'functionResponse.userParams.year',
    'year'
  ], 0, validators.isYear);

  // Calculate base price using our dedicated utility
  const basePrice = calculateBasePriceFromNested(priceData);

  // Construct normalized data
  const normalizedData = {
    make,
    model,
    year,
    vin: data.vin || '',
    transmission: normalizeTransmission(data.transmission),
    mileage: extractValue(data, ['mileage'], 0, validators.isNumber),
    valuation: basePrice,
    reservePrice: basePrice, // Will be calculated later using the reserve price formula
    averagePrice: priceData.price_med || 0,
    basePrice
  };

  // Determine if we have valid data
  const hasRequiredVehicleData = Boolean(make && model && year);
  const hasRequiredPriceData = Boolean(priceData.price_min && priceData.price_med);
  
  const hasValuation = hasRequiredVehicleData && hasRequiredPriceData;
  const hasError = !hasValuation;
  
  return {
    normalizedData,
    hasError,
    shouldShowError: hasError,
    hasValuation
  };
}
