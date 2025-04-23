
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Updated: 2025-04-23 - Strictly uses nested API response structure
 * Updated: 2025-04-24 - Fixed nested structure traversal with robust path handling
 * Updated: 2025-04-25 - Fixed duplicate property names in debug logging
 * Updated: 2025-04-26 - Enhanced price data extraction with better fallbacks
 * Updated: 2025-04-27 - Added detailed API response structure logging
 * Updated: 2025-04-28 - Implemented direct JSON inspection for nested data access
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
  // Log the entire raw data structure to see what we're working with
  console.log('[PRICE-EXTRACTOR] Raw API response (stringified):', JSON.stringify(data, null, 2));
  console.log('[PRICE-EXTRACTOR] Raw API response data type:', typeof data);
  
  // Log incoming data structure with better debugging
  console.log('[PRICE-EXTRACTOR] Analyzing API response structure:', {
    hasData: !!data,
    topLevelKeys: data ? Object.keys(data) : [],
    hasFunctionResponse: !!data?.functionResponse,
    hasNestedData: !!data?.data,
    hasNestedFunctionResponse: !!data?.data?.functionResponse
  });

  // Direct JSON path inspection for all possible price locations
  // This will help identify where prices might be in the structure
  console.log('[PRICE-EXTRACTOR] Deep scanning for price fields:');
  scanForPriceFields(data, '');

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
 * Recursively scan object for any price-related fields
 * This helps identify where in the structure prices might be hiding
 */
function scanForPriceFields(obj: any, path: string): void {
  if (!obj || typeof obj !== 'object') {
    return;
  }
  
  // Check if this object has any price-related fields
  const priceFields = ['price', 'price_min', 'price_med', 'price_max', 'price_avr', 'valuation', 'basePrice', 'reservePrice'];
  
  for (const key of Object.keys(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    // Check if this is a price field
    if (priceFields.includes(key) && typeof obj[key] === 'number' && obj[key] > 0) {
      console.log(`[PRICE-SCANNER] Found price field at ${currentPath}: ${obj[key]}`);
    }
    
    // Recurse into nested objects, but avoid circular references
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      scanForPriceFields(obj[key], currentPath);
    }
  }
}

/**
 * Extract price data from calcValuation object
 */
function extractFromCalcValuation(calcValuation: any): PriceData {
  if (!calcValuation) return {};
  
  console.log('[PRICE-EXTRACTOR] Extracting from calcValuation:', calcValuation);
  
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
  console.log('[PRICE-CALCULATOR] Calculating base price from:', priceData);
  
  // Option 1: Use price_min and price_med if available (preferred method)
  if (priceData.price_min && priceData.price_med) {
    const minPrice = Number(priceData.price_min);
    const medPrice = Number(priceData.price_med);
    
    if (!isNaN(minPrice) && !isNaN(medPrice) && minPrice > 0 && medPrice > 0) {
      const basePrice = (minPrice + medPrice) / 2;
      console.log('[PRICE-CALCULATOR] Calculated base price from min/med:', basePrice);
      return basePrice;
    } else {
      console.warn('[PRICE-CALCULATOR] Invalid min/med prices:', { minPrice, medPrice });
    }
  } else {
    console.warn('[PRICE-CALCULATOR] Missing required price data for calculation:', priceData);
  }
  
  // Option 2: Use price or valuation if available
  if (priceData.price && !isNaN(Number(priceData.price)) && Number(priceData.price) > 0) {
    console.log('[PRICE-CALCULATOR] Using direct price as base price:', priceData.price);
    return Number(priceData.price);
  }
  
  // Option 3: Use average price if available
  if (priceData.price_avr && !isNaN(Number(priceData.price_avr)) && Number(priceData.price_avr) > 0) {
    console.log('[PRICE-CALCULATOR] Using average price as base price:', priceData.price_avr);
    return Number(priceData.price_avr);
  }
  
  console.error('[PRICE-CALCULATOR] CRITICAL: Could not calculate base price - no valid price data available');
  return 0;
}
