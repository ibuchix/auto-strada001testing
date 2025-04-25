
/**
 * Changes made:
 * - 2025-05-02: Complete rewrite to directly access nested JSON structure
 * - 2025-05-02: Added explicit path extraction for functionResponse structure
 * - 2025-05-02: Removed fallback mechanisms in favor of direct extraction
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
 * Validates and normalizes valuation data specifically targeting the nested structure
 * from the external API response
 */
export function validateValuationData(data: any): ValidationResult {
  console.log('Validating data:', JSON.stringify(data, null, 2));
  
  if (!data) {
    console.warn('Validation called with empty data');
    return {
      normalizedData: {},
      hasError: true,
      shouldShowError: true,
      hasValuation: false
    };
  }

  // First, check if we have the expected nested structure
  const hasFunctionResponse = !!data.functionResponse;
  const hasUserParams = !!data.functionResponse?.userParams;
  const hasCalculationData = !!data.functionResponse?.valuation?.calcValuation;
  
  console.log('Data structure check:', {
    hasFunctionResponse,
    hasUserParams,
    hasCalculationData,
    topLevelKeys: Object.keys(data)
  });
  
  if (!hasFunctionResponse) {
    console.error('Missing functionResponse in API data');
    return {
      normalizedData: {
        error: 'Missing required data structure in API response',
        vin: data.vin || ''
      },
      hasError: true,
      shouldShowError: true, 
      hasValuation: false
    };
  }

  // Extract vehicle data directly from userParams
  const userParams = data.functionResponse.userParams || {};
  const make = userParams.make || '';
  const model = userParams.model || '';
  const year = Number(userParams.year) || 0;
  const vin = data.vin || '';
  
  console.log('Extracted vehicle data:', { make, model, year, vin });

  // Extract price data directly from calcValuation
  const priceData = extractNestedPriceData(data);
  console.log('Extracted price data:', priceData);
  
  // Calculate base price
  const basePrice = calculateBasePriceFromNested(priceData);
  
  // Get transmission
  const transmission = normalizeTransmission(
    userParams.gearbox || data.functionResponse?.userParams?.gearbox || 'manual'
  );

  // Construct normalized data
  const normalizedData = {
    make,
    model,
    year: Number(year),
    vin,
    transmission,
    mileage: Number(userParams.odometer || 0),
    valuation: basePrice,
    reservePrice: basePrice, // Will be replaced with calculation
    averagePrice: priceData.price_med || 0,
    basePrice
  };

  // Determine if we have valid data
  const hasRequiredVehicleData = Boolean(make && model && year);
  const hasRequiredPriceData = Boolean(priceData.price_min && priceData.price_med);
  
  const hasValuation = hasRequiredVehicleData && hasRequiredPriceData;
  const hasError = !hasValuation;
  
  console.log('Validation result:', {
    hasRequiredVehicleData,
    hasRequiredPriceData,
    hasValuation,
    hasError
  });
  
  return {
    normalizedData,
    hasError,
    shouldShowError: hasError,
    hasValuation
  };
}
