
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Handles extraction of deeply nested price data from API response
 */

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

export function extractNestedPriceData(data: any): PriceData {
  // First try to get price data from the correct nested path
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (calcValuation) {
    console.log('Found nested price data in calcValuation:', calcValuation);
    return {
      price: Number(calcValuation.price) || undefined,
      price_min: Number(calcValuation.price_min) || undefined,
      price_max: Number(calcValuation.price_max) || undefined,
      price_avr: Number(calcValuation.price_avr) || undefined,
      price_med: Number(calcValuation.price_med) || undefined
    };
  }
  
  // If we don't find the nested structure, log it
  console.warn('Could not find nested price data structure', {
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    topLevelKeys: Object.keys(data || {})
  });
  
  // Return empty object if no valid price data found
  return {};
}

export function calculateBasePriceFromNested(priceData: PriceData): number {
  if (!priceData.price_min || !priceData.price_med) {
    console.warn('Missing required price data for base price calculation', priceData);
    return 0;
  }

  return (Number(priceData.price_min) + Number(priceData.price_med)) / 2;
}

