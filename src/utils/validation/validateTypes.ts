
/**
 * Changes made:
 * - 2025-04-22: Fixed return type to properly handle nested API response structure
 * - 2025-04-22: Enhanced support for nested functionResponse in API data
 * - 2025-04-26: Fixed return type to ensure consistent object shape
 * - 2025-04-29: Fixed data extraction from nested API response structure
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
  
  // First, let's try to get the vehicle data from nested 'data' property if it exists
  // This handles the case where the API response is wrapped in a 'data' property
  const nestedVehicleData = data.data || {};
  
  // Check for error conditions
  const hasError = !!data.error || !!data.noData || (data.data && !!data.data.error);
  const errorMessage = data.error || (data.data && data.data.error) || '';
  
  // Extract ALL possible vehicle data paths (API response varies)
  const make = data.make || nestedVehicleData.make || '';
  const model = data.model || nestedVehicleData.model || '';
  const year = data.year || nestedVehicleData.year || 0;
  const vin = data.vin || nestedVehicleData.vin || '';
  
  // Check if functionResponse exists (new API structure)
  const functionResponse = data.functionResponse || (data.data && data.data.functionResponse) || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Extract vehicle data from functionResponse if we don't have it yet
  const finalMake = make || userParams.make || '';
  const finalModel = model || userParams.model || '';
  const finalYear = year || userParams.year || userParams.productionYear || 0;
  
  // Extract price data (try all possible paths)
  const hasNestedPriceData = calcValuation.price_min !== undefined && calcValuation.price_med !== undefined;
  
  // Calculate base price from all possible sources
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
      console.log('Using nested price data:', { priceMin, priceMed, basePrice });
    }
  }
  
  // For reserve price, use what we have or calculate it
  if (reservePrice <= 0 && basePrice > 0) {
    reservePrice = calculateReservePrice(basePrice);
  }
  
  // If we have vehicle data from the data property but not at the top level, use it
  if ((!finalMake || !finalModel) && nestedVehicleData.make && nestedVehicleData.model) {
    console.log('Using vehicle data from nested data property');
  }
  
  // Log all extracted data for debugging
  console.log('Extracted vehicle data:', {
    make: finalMake,
    model: finalModel,
    year: finalYear,
    basePrice,
    reservePrice,
    hasNestedPriceData
  });
  
  const normalizedData = {
    make: finalMake,
    model: finalModel,
    year: finalYear,
    vin,
    transmission: normalizeTransmission(data.transmission),
    mileage: data.mileage || 0,
    valuation: basePrice,
    reservePrice,
    averagePrice,
    basePrice,
    error: errorMessage,
    noData: !!data.noData,
    apiSource: data.apiSource || 'auto_iso',
    usingFallbackEstimation: !!data.usingFallbackEstimation,
    estimationMethod: data.estimationMethod || '',
    errorDetails: data.errorDetails || ''
  };
  
  // Check if we have basic vehicle data
  const hasVehicleData = !!finalMake && !!finalModel && finalYear > 0;
  const hasValuation = hasVehicleData && basePrice > 0;
  
  // If we don't have vehicle data but we DO have a `data` property with valid vehicle data
  // Don't show an error in that case, as we extracted the data successfully
  const shouldShowError = hasError || (!hasVehicleData && !nestedVehicleData.make && !nestedVehicleData.model);
  
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
