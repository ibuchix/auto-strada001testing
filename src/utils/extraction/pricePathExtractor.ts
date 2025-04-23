
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Updated: 2025-04-23 - Strictly uses nested API response structure
 * Updated: 2025-04-24 - Fixed nested structure traversal with robust path handling
 * Updated: 2025-04-25 - Fixed duplicate property names in debug logging
 * Updated: 2025-04-26 - Enhanced price data extraction with better fallbacks
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

  // ENHANCED: Check for price data at all possible locations
  let priceData: PriceData = {};

  // First try the nested calcValuation path which is most reliable when available
  if (data?.functionResponse?.valuation?.calcValuation) {
    const calcValuation = data.functionResponse.valuation.calcValuation;
    priceData = extractFromCalcValuation(calcValuation);
    console.log('[PRICE-EXTRACTOR] Found price data in functionResponse.valuation.calcValuation:', priceData);
    return priceData;
  }
  
  // Check in nested data structure
  if (data?.data?.functionResponse?.valuation?.calcValuation) {
    const calcValuation = data.data.functionResponse.valuation.calcValuation;
    priceData = extractFromCalcValuation(calcValuation);
    console.log('[PRICE-EXTRACTOR] Found price data in data.functionResponse.valuation.calcValuation:', priceData);
    return priceData;
  }
  
  // NEW: Try to find price_min and price_med directly in the data property
  if (data?.data?.price_min !== undefined && data?.data?.price_med !== undefined) {
    priceData = {
      price_min: Number(data.data.price_min),
      price_med: Number(data.data.price_med),
      price_avr: Number(data.data.price_avr),
      price_max: Number(data.data.price_max),
      price: Number(data.data.price || data.data.valuation)
    };
    console.log('[PRICE-EXTRACTOR] Found price data in data property:', priceData);
    return priceData;
  }
  
  // Try direct values at root level as last resort
  const directPriceData = {
    price: Number(data?.price || data?.valuation) || undefined,
    price_min: Number(data?.price_min) || undefined,
    price_max: Number(data?.price_max) || undefined,
    price_avr: Number(data?.price_avr) || undefined,
    price_med: Number(data?.price_med) || undefined
  };
  
  // Log what we found at the direct level
  const foundDirectPrices = Object.entries(directPriceData)
    .filter(([_, value]) => value !== undefined && !isNaN(value) && value > 0)
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
 * Extract price data from calcValuation object
 */
function extractFromCalcValuation(calcValuation: any): PriceData {
  if (!calcValuation) return {};
  
  return {
    price: Number(calcValuation.price) || undefined,
    price_min: Number(calcValuation.price_min) || undefined,
    price_max: Number(calcValuation.price_max) || undefined,
    price_avr: Number(calcValuation.price_avr) || undefined,
    price_med: Number(calcValuation.price_med) || undefined
  };
}

/**
 * Calculate base price from extracted nested price data
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  // ENHANCED: More flexible price calculation with better fallbacks
  
  // Option 1: Use price_min and price_med if available (preferred method)
  if (priceData.price_min && priceData.price_med) {
    const minPrice = Number(priceData.price_min);
    const medPrice = Number(priceData.price_med);
    
    if (!isNaN(minPrice) && !isNaN(medPrice) && minPrice > 0 && medPrice > 0) {
      const basePrice = (minPrice + medPrice) / 2;
      console.log('[PRICE-EXTRACTOR] Calculated base price from min/med:', basePrice);
      return basePrice;
    }
  }
  
  // Option 2: Use price or valuation if available
  if (priceData.price && !isNaN(Number(priceData.price)) && Number(priceData.price) > 0) {
    console.log('[PRICE-EXTRACTOR] Using direct price as base price:', priceData.price);
    return Number(priceData.price);
  }
  
  // Option 3: Use average price if available
  if (priceData.price_avr && !isNaN(Number(priceData.price_avr)) && Number(priceData.price_avr) > 0) {
    console.log('[PRICE-EXTRACTOR] Using average price as base price:', priceData.price_avr);
    return Number(priceData.price_avr);
  }
  
  console.warn('[PRICE-EXTRACTOR] Could not calculate base price from available data:', priceData);
  return 0;
}
