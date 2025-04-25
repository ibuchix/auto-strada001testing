
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Updated: 2025-04-25 - Rewritten to directly access nested calcValuation data
 */

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

/**
 * Extract price data from nested API response with direct path access
 */
export function extractNestedPriceData(rawData: any): PriceData {
  // Parse if string
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.error('[PRICE-EXTRACTOR] Failed to parse raw JSON:', e);
      return {};
    }
  }

  // Log the entire raw data structure
  console.log('[PRICE-EXTRACTOR] Processing raw data:', {
    hasData: !!data,
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
  });

  // Direct access to calcValuation object
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.error('[PRICE-EXTRACTOR] Failed to find calcValuation in response');
    return {};
  }

  console.log('[PRICE-EXTRACTOR] Found calcValuation:', calcValuation);

  return {
    price: Number(calcValuation.price),
    price_min: Number(calcValuation.price_min),
    price_max: Number(calcValuation.price_max),
    price_avr: Number(calcValuation.price_avr),
    price_med: Number(calcValuation.price_med)
  };
}

/**
 * Calculate base price from extracted nested price data
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  console.log('[PRICE-CALCULATOR] Calculating base price from:', priceData);
  
  // Use direct price calculation from min and median values
  if (priceData.price_min && priceData.price_med) {
    const basePrice = (Number(priceData.price_min) + Number(priceData.price_med)) / 2;
    console.log('[PRICE-CALCULATOR] Calculated base price:', basePrice);
    return basePrice;
  }
  
  // Fallback to direct price if available
  if (priceData.price && !isNaN(Number(priceData.price))) {
    console.log('[PRICE-CALCULATOR] Using direct price:', priceData.price);
    return Number(priceData.price);
  }
  
  console.error('[PRICE-CALCULATOR] Could not calculate base price - no valid price data');
  return 0;
}
