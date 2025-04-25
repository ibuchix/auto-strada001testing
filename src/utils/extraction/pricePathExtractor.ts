
/**
 * Price extraction utility specific for nested API response structure
 * Updated: 2025-05-02 - Completely rewritten to directly target nested JSON paths
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
  console.log('RAW DATA FOR PRICE EXTRACTION:', JSON.stringify(rawData, null, 2));
  
  // Parse if string
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.error('Failed to parse raw JSON:', e);
      return {};
    }
  }
  
  // ONLY target the specific nested path for calcValuation
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.error('Failed to find calcValuation at data.functionResponse.valuation.calcValuation');
    // Log the structure to help debug the issue
    console.log('Data structure received:', {
      hasData: !!data,
      hasFunctionResponse: !!data?.functionResponse,
      hasValuation: !!data?.functionResponse?.valuation,
      topLevelKeys: data ? Object.keys(data) : []
    });
    return {};
  }
  
  // Log the found calcValuation for debugging
  console.log('Found calcValuation:', calcValuation);

  return {
    price: Number(calcValuation.price),
    price_min: Number(calcValuation.price_min),
    price_max: Number(calcValuation.price_max),
    price_avr: Number(calcValuation.price_avr),
    price_med: Number(calcValuation.price_med)
  };
}

/**
 * Calculate base price from nested data using reliable and simple logic
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  console.log('Calculating base price from nested data:', priceData);
  
  if (!priceData || Object.keys(priceData).length === 0) {
    console.error('Empty price data provided to calculateBasePriceFromNested');
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
  
  console.error('Could not calculate base price - no valid price data');
  return 0;
}
