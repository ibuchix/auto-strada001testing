
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Updated: 2025-04-23 - Strictly uses nested API response structure
 */

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

export function extractNestedPriceData(data: any): PriceData {
  // Log incoming data structure
  console.log('[PRICE-EXTRACTOR] Received data structure:', {
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
  });

  // Get price data from the correct nested structure
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.warn('[PRICE-EXTRACTOR] Missing calcValuation in API response');
    return {};
  }

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
