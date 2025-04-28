
/**
 * Normalizes valuation data from various sources into a consistent format
 * Updated: 2025-04-28 - Enhanced to handle the improved edge function response format
 */

import { ValuationData } from "./valuationDataTypes";
import { normalizeTransmission } from "@/utils/validation/validateTypes";

/**
 * Normalizes valuation data from various sources into a consistent format
 */
export function normalizeValuationData(
  data: any,
  vin: string = '',
  mileage: number = 0
): ValuationData {
  // Trace input data
  console.log('[Normalizer] Normalizing valuation data:', {
    dataType: typeof data,
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : []
  });
  
  // Handle potentially nested data structure from API
  const rawData = data?.data || data || {};
  
  // Initialize with default values and known data
  const result: ValuationData = {
    vin: vin || rawData?.vin || '',
    make: rawData?.make || '',
    model: rawData?.model || '',
    year: Number(rawData?.year) || 0,
    transmission: normalizeTransmission(rawData?.transmission || 'manual'),
    mileage: Number(mileage || rawData?.mileage) || 0,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
  
  // Capture error information
  if (rawData?.error) {
    result.error = rawData.error;
  }
  
  if (rawData?.noData) {
    result.noData = true;
  }
  
  // Extract pricing data in priority order
  
  // Reserve price (primary pricing field)
  if (typeof rawData?.reservePrice === 'number' && !isNaN(rawData.reservePrice)) {
    result.reservePrice = rawData.reservePrice;
    result.valuation = rawData.reservePrice; // Ensure valuation is also set
  }
  
  // Main valuation/price field
  if (typeof rawData?.valuation === 'number' && !isNaN(rawData.valuation)) {
    result.valuation = rawData.valuation;
    // Only set reserve price if not already set
    if (!result.reservePrice) {
      result.reservePrice = rawData.valuation;
    }
  }
  
  // Base price and average price
  if (typeof rawData?.basePrice === 'number' && !isNaN(rawData.basePrice)) {
    result.basePrice = rawData.basePrice;
  }
  
  if (typeof rawData?.averagePrice === 'number' && !isNaN(rawData.averagePrice)) {
    result.averagePrice = rawData.averagePrice;
  } else if (result.basePrice) {
    result.averagePrice = result.basePrice;
  }
  
  // Ensure we have a valid reserve price or valuation
  if (!result.reservePrice && !result.valuation) {
    // No pricing data found, check original API values
    const price_min = Number(rawData?.price_min);
    const price_med = Number(rawData?.price_med);
    
    if (!isNaN(price_min) && !isNaN(price_med) && price_min > 0 && price_med > 0) {
      // Calculate base price using standard formula
      const basePrice = (price_min + price_med) / 2;
      result.basePrice = basePrice;
      result.averagePrice = basePrice;
      
      // Calculate reserve price based on base price
      result.reservePrice = calculateReservePrice(basePrice);
      result.valuation = result.reservePrice;
      
      console.log('[Normalizer] Calculated pricing manually:', {
        price_min,
        price_med,
        basePrice,
        reservePrice: result.reservePrice
      });
    }
  }
  
  // Ensure we never return NaN values
  Object.keys(result).forEach((key) => {
    if (typeof result[key] === 'number' && isNaN(result[key])) {
      result[key] = 0;
    }
  });
  
  // Log the final normalized result
  console.log('[Normalizer] Final normalized data:', {
    make: result.make,
    model: result.model,
    year: result.year,
    basePrice: result.basePrice,
    reservePrice: result.reservePrice,
    valuation: result.valuation
  });
  
  return result;
}

/**
 * Calculate reserve price based on base price using tiered percentage
 */
function calculateReservePrice(basePrice: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }
  
  let percentage: number;
  
  // Determine appropriate percentage based on price tier
  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;
  
  // Calculate and round to nearest integer
  return Math.round(basePrice - (basePrice * percentage));
}

/**
 * Validate that valuation data contains necessary fields
 */
export function validateValuationData(data: ValuationData): boolean {
  return !!(
    data.make && 
    data.model && 
    data.year > 0 && 
    (data.reservePrice > 0 || data.valuation > 0)
  );
}
