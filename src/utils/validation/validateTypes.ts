
/**
 * Changes made:
 * - 2025-04-22: Fixed return type to properly handle nested API response structure
 * - 2025-04-22: Enhanced support for nested functionResponse in API data
 */

import { TransmissionType } from "@/components/hero/valuation/types";

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
 * Handles nested structures like functionResponse
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
  
  // Check for error conditions
  const hasError = !!data.error || !!data.noData;
  const shouldShowError = hasError || (!data.make && !data.model);
  
  // Extract nested data if present
  const nestedData = data.data || {};
  const functionResponse = data.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Extract vehicle details (try all possible paths)
  const make = data.make || nestedData.make || userParams.make || '';
  const model = data.model || nestedData.model || userParams.model || '';
  const year = data.year || nestedData.year || userParams.year || userParams.productionYear || 0;
  const vin = data.vin || nestedData.vin || '';
  
  // Extract price data (try all possible paths)
  const hasNestedPriceData = calcValuation.price_min !== undefined && calcValuation.price_med !== undefined;
  
  // Calculate base price if we have nested price data
  let basePrice = data.basePrice || data.valuation || 0;
  let reservePrice = data.reservePrice || 0;
  let averagePrice = data.averagePrice || data.price_med || 0;
  
  // If we have nested price data, use that
  if (hasNestedPriceData) {
    const priceMin = Number(calcValuation.price_min);
    const priceMed = Number(calcValuation.price_med);
    
    // Only use if they're valid numbers
    if (!isNaN(priceMin) && !isNaN(priceMed) && priceMin > 0 && priceMed > 0) {
      basePrice = (priceMin + priceMed) / 2;
      averagePrice = priceMed;
    }
  }
  
  // For reserve price, use what we have or calculate it
  if (reservePrice <= 0 && basePrice > 0) {
    reservePrice = calculateReservePrice(basePrice);
  }
  
  const normalizedData = {
    make,
    model,
    year,
    vin,
    transmission: normalizeTransmission(data.transmission),
    mileage: data.mileage || 0,
    valuation: basePrice,
    reservePrice,
    averagePrice,
    basePrice,
    error: data.error || '',
    noData: !!data.noData,
    apiSource: data.apiSource || 'auto_iso',
    usingFallbackEstimation: !!data.usingFallbackEstimation,
    estimationMethod: data.estimationMethod || '',
    errorDetails: data.errorDetails || ''
  };
  
  // Check if we have basic vehicle data
  const hasVehicleData = !!make && !!model && year > 0;
  const hasValuation = hasVehicleData && basePrice > 0;
  
  console.log('Validation result:', {
    hasVehicleData,
    hasValuation,
    hasError,
    shouldShowError
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
