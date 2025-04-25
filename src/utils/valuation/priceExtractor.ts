
/**
 * Price extraction utility focused on calcValuation data
 * Updated: 2025-05-05 - Complete rewrite to handle any form of the nested API response
 */

export interface PriceData {
  price_min: number;
  price_med: number;
  basePrice: number;
  // Add these fields for type compatibility
  reservePrice?: number;
  valuation?: number;
  averagePrice?: number;
  noData?: boolean;
}

/**
 * Extract price data from the API response
 */
export function extractPriceData(data: any): PriceData | null {
  console.log('[PRICE-EXTRACTOR] Starting price extraction');
  
  if (!data) {
    console.error('[PRICE-EXTRACTOR] No data provided');
    return null;
  }
  
  // Check if we already have processed data at top level
  if (data.price_min !== undefined && data.price_med !== undefined) {
    console.log('[PRICE-EXTRACTOR] Found price data directly at top level');
    return {
      price_min: Number(data.price_min),
      price_med: Number(data.price_med),
      basePrice: data.basePrice || ((Number(data.price_min) + Number(data.price_med)) / 2)
    };
  }
  
  // First attempt: Look for calcValuation in functionResponse
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (calcValuation) {
    console.log('[PRICE-EXTRACTOR] Found calcValuation in functionResponse');
    const price_min = Number(calcValuation.price_min);
    const price_med = Number(calcValuation.price_med);
    
    if (!isNaN(price_min) && !isNaN(price_med) && price_min > 0 && price_med > 0) {
      const basePrice = (price_min + price_med) / 2;
      return { price_min, price_med, basePrice };
    }
  }
  
  // Second attempt: Look for rawNestedData
  const nestedCalcValuation = data?.rawNestedData?.calcValuation;
  
  if (nestedCalcValuation) {
    console.log('[PRICE-EXTRACTOR] Found calcValuation in rawNestedData');
    const price_min = Number(nestedCalcValuation.price_min);
    const price_med = Number(nestedCalcValuation.price_med);
    
    if (!isNaN(price_min) && !isNaN(price_med) && price_min > 0 && price_med > 0) {
      const basePrice = (price_min + price_med) / 2;
      return { price_min, price_med, basePrice };
    }
  }
  
  // Third attempt: Try to parse rawApiResponse
  if (data.rawApiResponse) {
    try {
      const parsedRaw = JSON.parse(data.rawApiResponse);
      const rawCalcValuation = parsedRaw?.functionResponse?.valuation?.calcValuation;
      
      if (rawCalcValuation) {
        console.log('[PRICE-EXTRACTOR] Found calcValuation in rawApiResponse');
        const price_min = Number(rawCalcValuation.price_min);
        const price_med = Number(rawCalcValuation.price_med);
        
        if (!isNaN(price_min) && !isNaN(price_med) && price_min > 0 && price_med > 0) {
          const basePrice = (price_min + price_med) / 2;
          return { price_min, price_med, basePrice };
        }
      }
    } catch (e) {
      console.error('[PRICE-EXTRACTOR] Failed to parse rawApiResponse:', e);
    }
  }
  
  // Log all price fields found in the response
  console.log('Price fields found anywhere in the response:', deepScanForPrices(data));
  
  console.error('[PRICE-EXTRACTOR] Could not extract valid price data from any source');
  return null;
}

/**
 * Deep scans an object for price-related fields - used for debugging
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
 * Utility to extract nested data from an API response
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
