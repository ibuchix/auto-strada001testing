
/**
 * Price extraction utility focused on calcValuation data
 * Created: 2025-04-24
 */

interface PriceData {
  price_min: number;
  price_med: number;
  basePrice: number;
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
  
  return { price_min, price_med, basePrice };
}
