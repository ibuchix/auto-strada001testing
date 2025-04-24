
/**
 * Cache validation utilities for valuation data
 * Created: 2025-04-24
 */

import { ValuationData } from "../valuationDataTypes";

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

export function isValidCacheEntry(data: any): ValidationResult {
  if (!data) {
    return { isValid: false, reason: 'No data found' };
  }

  // Check for base price data
  const hasBasePricing = !!(
    (data.price_min && data.price_med) || 
    (data.basePrice && data.averagePrice) ||
    (data.valuation && data.reservePrice)
  );

  if (!hasBasePricing) {
    return { 
      isValid: false, 
      reason: 'Missing required price data' 
    };
  }

  // Check for required nested structures
  const hasNestedStructure = !!(
    data.functionResponse?.valuation?.calcValuation ||
    (data.price_min && data.price_med)  // Alternative valid structure
  );

  if (!hasNestedStructure) {
    return { 
      isValid: false, 
      reason: 'Missing required valuation calculation structure' 
    };
  }

  // Verify price values are non-zero
  const priceFields = [
    data.price_min,
    data.price_med,
    data.basePrice,
    data.averagePrice,
    data.valuation,
    data.reservePrice,
    data.functionResponse?.valuation?.calcValuation?.price_min,
    data.functionResponse?.valuation?.calcValuation?.price_med
  ];

  const hasValidPrices = priceFields.some(price => 
    typeof price === 'number' && price > 0
  );

  if (!hasValidPrices) {
    return { 
      isValid: false, 
      reason: 'All price values are zero or invalid' 
    };
  }

  // Check for required vehicle identification data
  if (!data.make || !data.model || !data.year) {
    return { 
      isValid: false, 
      reason: 'Missing required vehicle identification data' 
    };
  }

  return { isValid: true };
}

/**
 * Helper to check if we should use cached data
 */
export function shouldUseCachedData(cachedData: any): boolean {
  const validation = isValidCacheEntry(cachedData);
  
  if (!validation.isValid) {
    console.warn('Cache validation failed:', validation.reason, {
      cachedData: JSON.stringify(cachedData).substring(0, 200) + '...'
    });
    return false;
  }
  
  return true;
}
