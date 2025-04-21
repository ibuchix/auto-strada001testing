
/**
 * Price extraction utilities for valuation data
 * Created: 2025-04-20 - Extracted from existing code to support the valueDataNormalizer
 * Updated: 2025-04-25 - Enhanced price data extraction from varied API response formats
 */

import { calculateReservePrice } from './valuationCalculator';

/**
 * Extract price from valuation response data with fallbacks
 */
export const extractPrice = (responseData: any): number => {
  if (!responseData) {
    console.error('[PRICE-EXTRACTOR] Empty response data');
    return 0;
  }

  console.log('[PRICE-EXTRACTOR] Attempting to extract price from response:', {
    dataKeys: Object.keys(responseData),
    hasFunctionResponse: !!responseData.functionResponse,
    hasCalcValuation: !!responseData.functionResponse?.valuation?.calcValuation,
    hasDirectPrices: !!(responseData.price_min || responseData.price_med || responseData.basePrice)
  });

  // CASE 1: Check for Auto ISO API specific fields (nested structure)
  if (responseData.functionResponse?.valuation?.calcValuation) {
    const calcValuation = responseData.functionResponse.valuation.calcValuation;
    
    // Log what we found in the nested structure
    console.log('[PRICE-EXTRACTOR] Found nested calcValuation:', {
      calcValuationKeys: Object.keys(calcValuation),
      priceMin: calcValuation.price_min,
      priceMed: calcValuation.price_med,
      price: calcValuation.price
    });
    
    if (calcValuation.price_min !== undefined && calcValuation.price_med !== undefined) {
      const basePrice = (Number(calcValuation.price_min) + Number(calcValuation.price_med)) / 2;
      if (basePrice > 0) {
        console.log('[PRICE-EXTRACTOR] Calculated base price from nested calcValuation:', basePrice);
        return basePrice;
      }
    }
  }
  
  // CASE 2: Check for Auto ISO API fields at root level
  if (responseData.price_min !== undefined && responseData.price_med !== undefined) {
    const basePrice = (Number(responseData.price_min) + Number(responseData.price_med)) / 2;
    if (basePrice > 0) {
      console.log('[PRICE-EXTRACTOR] Calculated base price from root level min/med:', basePrice);
      return basePrice;
    }
  }
  
  // CASE 3: Direct price fields with validation - check these fields in order of priority
  const priceSources = [
    { field: 'basePrice', value: responseData?.basePrice },
    { field: 'price', value: responseData?.price },
    { field: 'valuation', value: responseData?.valuation },
    { field: 'price_med', value: responseData?.price_med },
    { field: 'marketValue', value: responseData?.marketValue },
    { field: 'estimatedValue', value: responseData?.estimatedValue }
  ];
  
  for (const source of priceSources) {
    if (typeof source.value === 'number' && source.value > 0) {
      console.log(`[PRICE-EXTRACTOR] Found direct price in ${source.field}:`, source.value);
      return source.value;
    } else if (typeof source.value === 'string' && !isNaN(Number(source.value)) && Number(source.value) > 0) {
      // Handle string numbers as well
      const numericValue = Number(source.value);
      console.log(`[PRICE-EXTRACTOR] Found string numeric price in ${source.field}:`, numericValue);
      return numericValue;
    }
  }
  
  // CASE 4: Check nested data structures (common in API responses)
  const nestedObjects = ['data', 'apiResponse', 'apiData', 'valuationDetails'];
  for (const key of nestedObjects) {
    if (responseData[key] && typeof responseData[key] === 'object') {
      const nestedData = responseData[key];
      
      // Check if nested object has price fields
      const nestedPrice = extractPrice(nestedData);
      if (nestedPrice > 0) {
        console.log(`[PRICE-EXTRACTOR] Found price in nested object '${key}':`, nestedPrice);
        return nestedPrice;
      }
    }
  }

  console.error('[PRICE-EXTRACTOR] No valid price found in response');
  return 0;
};

/**
 * Deep scan an object for price-related fields
 * Used as a last resort when other extraction methods fail
 */
export const deepScanForPrices = (obj: any, path: string = ''): Record<string, number> => {
  const results: Record<string, number> = {};
  
  if (!obj || typeof obj !== 'object') {
    return results;
  }
  
  // Check all keys at this level
  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;
    const value = obj[key];
    
    // If it looks like a price field and has a numeric value, record it
    if (
      (key.toLowerCase().includes('price') || 
       key.toLowerCase().includes('value') || 
       key.toLowerCase().includes('valuation')) && 
      (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value))))
    ) {
      const numericValue = typeof value === 'number' ? value : Number(value);
      if (numericValue > 0) {
        results[currentPath] = numericValue;
      }
    }
    
    // Recursively check nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nestedResults = deepScanForPrices(value, currentPath);
      Object.assign(results, nestedResults);
    }
  }
  
  return results;
};

// Re-export for convenience
export { calculateReservePrice };
