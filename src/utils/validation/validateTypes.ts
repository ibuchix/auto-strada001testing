/**
 * Changes made:
 * - 2025-05-03: Updated to use new nested price extraction
 * - 2025-05-03: Removed all fallback price estimation
 */

import { TransmissionType } from "@/components/hero/valuation/types";
import { extractValue, validators } from "@/utils/extraction/dataExtractor";
import { extractNestedPriceData } from "@/utils/extraction/pricePathExtractor";

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

  // Extract price data from nested structure
  const priceData = extractNestedPriceData(data);
  
  // Extract vehicle data (make, model, year)
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

  // Construct normalized data
  const normalizedData = {
    make,
    model,
    year,
    vin: data.vin || '',
    transmission: normalizeTransmission(data.transmission),
    mileage: extractValue(data, ['mileage'], 0, validators.isNumber),
    // Use the nested price data
    valuation: priceData.price || 0,
    reservePrice: 0, // Will be calculated later
    averagePrice: priceData.price_med || 0,
    basePrice: (priceData.price_min && priceData.price_med) 
      ? (Number(priceData.price_min) + Number(priceData.price_med)) / 2 
      : 0
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
