
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Updated: 2025-04-23 - Strictly uses nested API response structure
 * Updated: 2025-04-24 - Fixed nested structure traversal with robust path handling
 * Updated: 2025-04-25 - Fixed duplicate property names in debug logging
 */

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

/**
 * Extract price data from nested API response with improved structure handling
 */
export function extractNestedPriceData(data: any): PriceData {
  // Log incoming data structure with better debugging
  console.log('[PRICE-EXTRACTOR] Analyzing API response structure:', {
    hasData: !!data,
    topLevelKeys: data ? Object.keys(data) : [],
    hasFunctionResponse: !!data?.functionResponse,
    hasNestedData: !!data?.data,
    hasNestedFunctionResponse: !!data?.data?.functionResponse
  });

  // Check multiple possible paths where price data might be located
  // First try direct function response
  let calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  // If not found, check in data property
  if (!calcValuation && data?.data?.functionResponse) {
    calcValuation = data.data.functionResponse.valuation?.calcValuation;
    console.log('[PRICE-EXTRACTOR] Found calcValuation in data.functionResponse path');
  }
  
  if (calcValuation) {
    console.log('[PRICE-EXTRACTOR] Found calcValuation data:', calcValuation);
    
    // Return the price data directly from calcValuation
    return {
      price: Number(calcValuation.price) || undefined,
      price_min: Number(calcValuation.price_min) || undefined,
      price_max: Number(calcValuation.price_max) || undefined,
      price_avr: Number(calcValuation.price_avr) || undefined,
      price_med: Number(calcValuation.price_med) || undefined
    };
  }
  
  // If still not found, check for direct price fields at root level
  console.warn('[PRICE-EXTRACTOR] Missing calcValuation in API response');
  
  // Try direct price fields in different locations
  const directPriceData = {
    price: Number(data?.price || data?.data?.price) || undefined,
    price_min: Number(data?.price_min || data?.data?.price_min) || undefined,
    price_max: Number(data?.price_max || data?.data?.price_max) || undefined,
    price_avr: Number(data?.price_avr || data?.data?.price_avr) || undefined,
    price_med: Number(data?.price_med || data?.data?.price_med) || undefined
  };
  
  // Log what we found at the direct level
  const foundDirectPrices = Object.entries(directPriceData)
    .filter(([_, value]) => value !== undefined)
    .map(([key]) => key);
  
  if (foundDirectPrices.length > 0) {
    console.log('[PRICE-EXTRACTOR] Found direct price fields:', 
      foundDirectPrices.join(', '), directPriceData);
    return directPriceData;
  }
  
  console.warn('[PRICE-EXTRACTOR] No price data found in any expected location');
  return {};
}

/**
 * Calculate base price from extracted nested price data
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  if (!priceData.price_min || !priceData.price_med) {
    console.warn('[PRICE-EXTRACTOR] Missing required price data for calculation', priceData);
    return 0;
  }

  const minPrice = Number(priceData.price_min);
  const medPrice = Number(priceData.price_med);

  // Return 0 if any price is invalid
  if (isNaN(minPrice) || isNaN(medPrice) || minPrice <= 0 || medPrice <= 0) {
    console.warn('[PRICE-EXTRACTOR] Invalid price values:', { minPrice, medPrice });
    return 0;
  }

  const basePrice = (minPrice + medPrice) / 2;
  console.log('[PRICE-EXTRACTOR] Calculated base price:', basePrice);
  
  return basePrice;
}
