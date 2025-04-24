
/**
 * Price extraction utility focused on calcValuation data
 * Created: 2025-04-24
 * Updated: 2025-04-24 - Enhanced with better type safety and improved exports
 * Updated: 2025-04-25 - Added error handling and better diagnostics
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

export function extractPriceData(data: any): PriceData | null {
  // First, log the raw response for debugging
  console.log('[PRICE-EXTRACTOR] Raw API response (stringified):', JSON.stringify(data, null, 2));
  console.log('[PRICE-EXTRACTOR] Raw API response data type:', typeof data);
  
  // Check if we received an error response
  if (data?.error) {
    console.error('[PRICE-EXTRACTOR] API returned an error:', data.error);
    return null;
  }
  
  // Log the structure of what we received to help debug
  console.log('[PRICE-EXTRACTOR] Analyzing API response structure:', {
    hasData: !!data,
    isObject: typeof data === 'object',
    topLevelKeys: data ? Object.keys(data) : [],
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
  });

  // Use deepScanForPrices to find any price data in the response
  const priceFields = deepScanForPrices(data);
  console.log('[PRICE-EXTRACTOR] Deep scanning for price fields:', priceFields);
  
  // Get calcValuation - only source of truth for prices
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.warn('[PRICE-EXTRACTOR] No calcValuation found in response');
    
    // Log the path structure we were expecting
    if (data?.functionResponse) {
      console.log('[PRICE-EXTRACTOR] functionResponse exists but is missing expected data:', {
        hasValuation: !!data.functionResponse.valuation,
        valuationKeys: data.functionResponse.valuation ? Object.keys(data.functionResponse.valuation) : 'missing'
      });
    } else {
      console.log('[PRICE-EXTRACTOR] functionResponse path is missing entirely');
    }
    
    return null;
  }
  
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
    averagePrice: price_med,
    // Reserve price will be calculated separately
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
 */
export function extractData(data: any, fieldPaths: string[], defaultValue: any = null): any {
  if (!data) return defaultValue;
  
  console.log(`Extracting data for paths: [${fieldPaths.join(', ')}]`, data);
  
  for (const path of fieldPaths) {
    try {
      // Split the path and navigate through the object
      const parts = path.split('.');
      let value = data;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          console.log(`No value found at path ${path}, trying next option`);
          value = undefined;
          break;
        }
      }
      
      if (value !== undefined) {
        console.log(`Found value at path ${path}:`, value);
        return value;
      }
    } catch (err) {
      console.log(`Error extracting data from path ${path}:`, err);
    }
  }
  
  console.log(`No value found for any paths [${fieldPaths.join(', ')}], using default:`, defaultValue);
  return defaultValue;
}
