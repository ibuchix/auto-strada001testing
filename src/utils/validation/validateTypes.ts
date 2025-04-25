
/**
 * Changes made:
 * - 2025-05-05: Complete rewrite to handle any form of the nested API response
 */

import { TransmissionType } from "@/components/hero/valuation/types";
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
 * Validates and normalizes valuation data from ANY form of the API response
 */
export function validateValuationData(data: any): ValidationResult {
  console.log('Validating data:', JSON.stringify(data, null, 2));
  
  if (!data) {
    return {
      normalizedData: {},
      hasError: true,
      shouldShowError: true,
      hasValuation: false
    };
  }

  // Step 1: Extract vehicle data from various possible paths
  let make, model, year, vin, transmission, mileage;
  
  // First priority: Check direct fields (processed by our edge function)
  make = data.make;
  model = data.model;
  year = data.year;
  vin = data.vin;
  transmission = data.transmission || data.gearbox || 'manual';
  mileage = data.mileage || data.odometer || 0;
  
  // Second priority: Check nested functionResponse structure
  if (!make || !model || !year) {
    const userParams = data?.functionResponse?.userParams ||
                      data?.rawNestedData?.userParams;
    
    if (userParams) {
      make = make || userParams.make;
      model = model || userParams.model;
      year = year || userParams.year;
      transmission = transmission || userParams.gearbox || 'manual';
      mileage = mileage || userParams.odometer || 0;
    }
  }
  
  // Third priority: Check for error info
  const hasErrorMessage = !!data.error;
  const vinFromError = data.vin; // Often included even in error responses

  // Step 2: Extract price data from calcValuation
  const priceData = extractNestedPriceData(data);
  
  // Calculate base price
  const basePrice = calculateBasePriceFromNested(priceData);
  
  // Calculate reserve price
  const reservePrice = calculateReservePrice(basePrice);

  // Step 3: Construct normalized data
  const normalizedData = {
    make: make || '',
    model: model || '',
    year: Number(year) || 0,
    vin: vin || vinFromError || '',
    transmission: normalizeTransmission(transmission),
    mileage: Number(mileage) || 0,
    valuation: basePrice || 0,
    reservePrice: reservePrice || 0,
    averagePrice: priceData.price_med || 0,
    basePrice: basePrice || 0,
    // Error info
    error: data.error || '',
    noData: !make || !model || !year || basePrice <= 0
  };

  // Step 4: Determine validation result
  const hasRequiredVehicleData = Boolean(normalizedData.make && normalizedData.model && normalizedData.year > 0);
  const hasRequiredPriceData = Boolean(normalizedData.basePrice > 0);
  
  const hasValuation = hasRequiredVehicleData && hasRequiredPriceData;
  const hasError = !hasValuation || hasErrorMessage;
  
  return {
    normalizedData,
    hasError,
    shouldShowError: hasError,
    hasValuation
  };
}

/**
 * Calculate reserve price based on base price tiers
 */
function calculateReservePrice(basePrice: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }
  
  let percentageDiscount;
  
  // Determine percentage based on price tier
  if (basePrice <= 15000) percentageDiscount = 0.65;
  else if (basePrice <= 20000) percentageDiscount = 0.46;
  else if (basePrice <= 30000) percentageDiscount = 0.37;
  else if (basePrice <= 50000) percentageDiscount = 0.27;
  else if (basePrice <= 60000) percentageDiscount = 0.27;
  else if (basePrice <= 70000) percentageDiscount = 0.22;
  else if (basePrice <= 80000) percentageDiscount = 0.23;
  else if (basePrice <= 100000) percentageDiscount = 0.24;
  else if (basePrice <= 130000) percentageDiscount = 0.20;
  else if (basePrice <= 160000) percentageDiscount = 0.185;
  else if (basePrice <= 200000) percentageDiscount = 0.22;
  else if (basePrice <= 250000) percentageDiscount = 0.17;
  else if (basePrice <= 300000) percentageDiscount = 0.18;
  else if (basePrice <= 400000) percentageDiscount = 0.18;
  else if (basePrice <= 500000) percentageDiscount = 0.16;
  else percentageDiscount = 0.145; // 500,001+
  
  return Math.round(basePrice - (basePrice * percentageDiscount));
}
