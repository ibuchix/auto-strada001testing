/**
 * Changes made:
 * - 2025-05-03: Updated to use new nested price extraction
 * - 2025-05-03: Removed all fallback price estimation
 * - 2025-04-23: Now uses dedicated pricePathExtractor utility
 */

import { TransmissionType } from "@/components/hero/valuation/types";
import { extractData, validators } from "@/utils/extraction/dataExtractor";
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
  
  // Extract vehicle data focusing on nested paths
  const make = extractData(data, [
    'functionResponse.userParams.make',
    'functionResponse.userParams.manufacturer'
  ], '');
  
  const model = extractData(data, [
    'functionResponse.userParams.model',
    'functionResponse.userParams.modelName'
  ], '');
  
  const year = extractData(data, [
    'functionResponse.userParams.year',
    'functionResponse.userParams.productionYear'
  ], 0);

  // Calculate base price using our dedicated utility
  const basePrice = calculateBasePriceFromNested(priceData);

  // Construct normalized data
  const normalizedData = {
    make,
    model,
    year: Number(year),
    vin: extractData(data, ['vin'], ''),
    transmission: normalizeTransmission(
      extractData(data, [
        'functionResponse.userParams.gearbox', 
        'transmission'
      ], 'manual')
    ),
    mileage: extractData(data, [
      'functionResponse.userParams.odometer', 
      'mileage'
    ], 0),
    valuation: basePrice,
    reservePrice: basePrice,
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
