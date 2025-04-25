
/**
 * Price extraction utility focused on calcValuation data
 * Updated: 2025-05-02 - Complete rewrite to directly target nested calcValuation 
 */

export interface PriceData {
  price_min: number;
  price_med: number;
  basePrice: number;
  // Add these fields to fix the type errors
  reservePrice?: number;
  valuation?: number;
  averagePrice?: number;
  noData?: boolean;
}

/**
 * Extract price data ONLY from the nested calcValuation object
 */
export function extractPriceData(data: any): PriceData | null {
  console.log('[PRICE-EXTRACTOR] Starting price extraction from nested structure');
  console.log('[PRICE-EXTRACTOR] Raw data type:', typeof data);
  
  if (!data) {
    console.error('[PRICE-EXTRACTOR] No data provided');
    return null;
  }
  
  // Log structure of what we received
  console.log('[PRICE-EXTRACTOR] Data structure:', {
    hasData: !!data,
    isObject: typeof data === 'object',
    topLevelKeys: Object.keys(data),
    hasFunctionResponse: !!data.functionResponse
  });

  // ONLY look for the specific nested path
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.error('[PRICE-EXTRACTOR] Missing calcValuation at data.functionResponse.valuation.calcValuation');
    
    if (data.functionResponse) {
      console.log('[PRICE-EXTRACTOR] functionResponse exists but has keys:', Object.keys(data.functionResponse));
      if (data.functionResponse.valuation) {
        console.log('[PRICE-EXTRACTOR] valuation exists with keys:', Object.keys(data.functionResponse.valuation));
      } else {
        console.log('[PRICE-EXTRACTOR] valuation is missing in functionResponse');
      }
    } else {
      console.log('[PRICE-EXTRACTOR] functionResponse path is missing entirely');
    }
    
    return null;
  }
  
  console.log('[PRICE-EXTRACTOR] Found calcValuation:', calcValuation);
  
  // Extract and validate price data
  const price_min = Number(calcValuation.price_min);
  const price_med = Number(calcValuation.price_med);
  
  // Validate prices
  if (isNaN(price_min) || isNaN(price_med) || price_min <= 0 || price_med <= 0) {
    console.warn('[PRICE-EXTRACTOR] Invalid price data in calcValuation:', { price_min, price_med });
    return null;
  }
  
  // Calculate base price
  const basePrice = (price_min + price_med) / 2;
  
  console.log('[PRICE-EXTRACTOR] Successfully extracted price data:', { price_min, price_med, basePrice });
  
  return { 
    price_min, 
    price_med, 
    basePrice,
    // Adding derived fields to maintain compatibility
    valuation: basePrice,
    averagePrice: price_med
  };
}

/**
 * Deep scans an object for price-related fields
 * Used for debugging API responses
 */
export function deepScanForPrices(obj: any): Record<string, number> {
  if (!obj || typeof obj !== 'object') {
    return {};
  }

  const priceFields: Record<string, number> = {};
  const priceKeys = ['price', 'price_min', 'price_med', 'price_max', 'price_avr', 
                     'valuation', 'basePrice', 'reservePrice', 'averagePrice'];

  function scan(o: any, path: string) {
    if (!o || typeof o !== 'object') return;

    for (const key of Object.keys(o)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (priceKeys.includes(key) && typeof o[key] === 'number' && o[key] > 0) {
        priceFields[currentPath] = o[key];
      }
      
      if (typeof o[key] === 'object' && o[key] !== null) {
        scan(o[key], currentPath);
      }
    }
  }

  scan(obj, '');
  return priceFields;
}

/**
 * Utility to help extract nested data from an API response
 * Tries multiple possible paths and returns the first non-empty value
 * This is used for more general data extraction
 */
export function extractData(data: any, fieldPaths: string[], defaultValue: any = null): any {
  if (!data) return defaultValue;
  
  for (const path of fieldPaths) {
    try {
      // Split the path and navigate through the object
      const parts = path.split('.');
      let value = data;
      let valid = true;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          valid = false;
          break;
        }
      }
      
      if (valid && value !== undefined) {
        return value;
      }
    } catch (err) {
      console.log(`Error extracting data from path ${path}:`, err);
    }
  }
  
  return defaultValue;
}
