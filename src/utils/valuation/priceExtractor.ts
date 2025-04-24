
/**
 * Price extraction utility focused on calcValuation data
 * Created: 2025-04-24
 * Updated: 2025-04-24 - Enhanced with better type safety and improved exports
 */

interface PriceData {
  price_min: number;
  price_med: number;
  basePrice: number;
  // Add these fields to fix the type errors
  reservePrice?: number;
  valuation?: number;
  averagePrice?: number;
}

export function extractPriceData(data: any): PriceData | null {
  // First, inspect the response
  console.group('[PRICE-EXTRACTOR] Extracting price data');
  
  // Log the path we're checking
  console.log('Checking calcValuation path:', {
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
  });
  
  // Get calcValuation - only source of truth for prices
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.warn('No calcValuation found in response');
    console.groupEnd();
    return null;
  }
  
  // Extract and validate price data
  const price_min = Number(calcValuation.price_min);
  const price_med = Number(calcValuation.price_med);
  
  // Validate prices
  if (isNaN(price_min) || isNaN(price_med) || price_min <= 0 || price_med <= 0) {
    console.warn('Invalid price data in calcValuation:', { price_min, price_med });
    console.groupEnd();
    return null;
  }
  
  // Calculate base price
  const basePrice = (price_min + price_med) / 2;
  
  console.log('Successfully extracted price data:', { price_min, price_med, basePrice });
  console.groupEnd();
  
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
