
/**
 * Price extraction utility specific for nested API response structure
 * Updated: 2025-05-05 - Complete rewrite for direct access to price data
 */

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

/**
 * Extract price data exclusively from nested calcValuation object
 */
export function extractNestedPriceData(rawData: any): PriceData {
  console.log('[PRICE-EXTRACTOR] Raw data received:', typeof rawData);
  
  // Parse if string
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.error('[PRICE-EXTRACTOR] Failed to parse raw JSON:', e);
    }
  }
  
  // Log important structure info
  console.log('[PRICE-EXTRACTOR] Examining data structure with keys:', Object.keys(data));
  
  // DIRECT PATH: Look specifically for the calcValuation nested object
  // First, check if data itself is the response from our edge function
  if (data?.price_min !== undefined && data?.price_med !== undefined) {
    console.log('[PRICE-EXTRACTOR] Found price data directly at top level');
    return {
      price: Number(data.price || data.basePrice),
      price_min: Number(data.price_min),
      price_max: Number(data.price_max || 0),
      price_avr: Number(data.price_avr || 0),
      price_med: Number(data.price_med)
    };
  }
  
  // Next, check if we have the raw calcValuation from the API directly
  if (data?.functionResponse?.valuation?.calcValuation) {
    console.log('[PRICE-EXTRACTOR] Found nested calcValuation');
    const calcValuation = data.functionResponse.valuation.calcValuation;
    return {
      price: Number(calcValuation.price),
      price_min: Number(calcValuation.price_min),
      price_max: Number(calcValuation.price_max),
      price_avr: Number(calcValuation.price_avr),
      price_med: Number(calcValuation.price_med)
    };
  }
  
  // Next, check if we have nested data in rawNestedData
  if (data?.rawNestedData?.calcValuation) {
    console.log('[PRICE-EXTRACTOR] Found calcValuation in rawNestedData');
    const calcValuation = data.rawNestedData.calcValuation;
    return {
      price: Number(calcValuation.price),
      price_min: Number(calcValuation.price_min),
      price_max: Number(calcValuation.price_max),
      price_avr: Number(calcValuation.price_avr),
      price_med: Number(calcValuation.price_med)
    };
  }
  
  // Next, check for raw API response pattern
  if (data?.rawApiResponse) {
    try {
      const parsedRaw = JSON.parse(data.rawApiResponse);
      if (parsedRaw?.functionResponse?.valuation?.calcValuation) {
        console.log('[PRICE-EXTRACTOR] Found calcValuation in rawApiResponse');
        const calcValuation = parsedRaw.functionResponse.valuation.calcValuation;
        return {
          price: Number(calcValuation.price),
          price_min: Number(calcValuation.price_min),
          price_max: Number(calcValuation.price_max),
          price_avr: Number(calcValuation.price_avr),
          price_med: Number(calcValuation.price_med)
        };
      }
    } catch (e) {
      console.error('[PRICE-EXTRACTOR] Failed to parse rawApiResponse:', e);
    }
  }
  
  // Log failure
  console.error('[PRICE-EXTRACTOR] Could not find price data in any expected location');
  const allPriceFields = findAllPriceFields(data);
  console.log('[PRICE-EXTRACTOR] Price fields found anywhere in the response:', allPriceFields);
  
  return {};
}

/**
 * Calculate base price from nested data using reliable and simple logic
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  console.log('Calculating base price from nested data:', priceData);
  
  if (!priceData || Object.keys(priceData).length === 0) {
    console.error('[PRICE-EXTRACTOR] Empty price data provided');
    return 0;
  }
  
  // Use direct price calculation from min and median values
  if (priceData.price_min && priceData.price_med) {
    const basePrice = (Number(priceData.price_min) + Number(priceData.price_med)) / 2;
    console.log('Calculated base price:', basePrice);
    return basePrice;
  }
  
  // Fallback to direct price if available
  if (priceData.price && !isNaN(Number(priceData.price))) {
    console.log('Using direct price:', priceData.price);
    return Number(priceData.price);
  }
  
  console.error('[PRICE-EXTRACTOR] Could not calculate base price - no valid price data');
  return 0;
}

/**
 * Helper function to find all price-related fields in an object
 */
function findAllPriceFields(obj: any): Record<string, any> {
  const result: Record<string, any> = {};
  
  function scan(o: any, path: string = '') {
    if (!o || typeof o !== 'object') return;
    
    for (const key of Object.keys(o)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      // Check if this is a price-related field
      if (/price|valuation|cost|value/i.test(key) && (typeof o[key] === 'number' || !isNaN(Number(o[key])))) {
        result[currentPath] = o[key];
      }
      
      // Recurse into objects
      if (o[key] && typeof o[key] === 'object') {
        scan(o[key], currentPath);
      }
    }
  }
  
  scan(obj);
  return result;
}
