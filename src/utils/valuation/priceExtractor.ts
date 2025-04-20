
/**
 * Price extraction utilities for valuation data
 * Created: 2025-04-20 - Extracted from existing code to support the valueDataNormalizer
 */

import { calculateReservePrice } from './valuationCalculator';

/**
 * Extract price from valuation response data with fallbacks
 */
export const extractPrice = (responseData: any): number => {
  if (!responseData) {
    console.error('Price extraction failed: Empty response data');
    return 0;
  }

  // Check for Auto ISO API specific fields first
  if (responseData.price_min !== undefined && responseData.price_med !== undefined) {
    // This is the format from the Auto ISO API
    const basePrice = (Number(responseData.price_min) + Number(responseData.price_med)) / 2;
    if (basePrice > 0) {
      console.log('AUTO ISO API: Calculated base price from min/med:', basePrice);
      return basePrice;
    }
  }
  
  // Direct price fields with validation - check these fields in order of priority
  const priceSources = [
    responseData?.basePrice,
    responseData?.price,
    responseData?.valuation,
    responseData?.price_med,
    responseData?.marketValue,
    responseData?.estimatedValue
  ];
  
  for (const price of priceSources) {
    if (typeof price === 'number' && price > 0) {
      console.log('Found direct price:', price);
      return price;
    }
  }
  
  // Check nested data structures (common in API responses)
  const nestedObjects = ['data', 'apiResponse', 'apiData', 'valuationDetails'];
  for (const key of nestedObjects) {
    if (responseData[key] && typeof responseData[key] === 'object') {
      const nestedData = responseData[key];
      
      // Check if nested object has price fields
      const nestedPrice = extractPrice(nestedData);
      if (nestedPrice > 0) {
        return nestedPrice;
      }
    }
  }

  console.error('No valid price found in response');
  return 0;
};

// Re-export for convenience
export { calculateReservePrice };
