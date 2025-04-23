
/**
 * Price data extraction utility
 * Created: 2025-05-03
 * Updated: 2025-04-23 - Enhanced nested path extraction for API data
 * Handles extraction of deeply nested price data from API response
 */

interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

/**
 * Extracts price data from the API response, handling the nested structure
 * @param data API response data
 * @returns Object containing extracted price values
 */
export function extractNestedPriceData(data: any): PriceData {
  // Check if we have data
  if (!data) {
    console.warn('extractNestedPriceData called with empty data');
    return {};
  }

  // First try to get price data from the correct nested path (most reliable source)
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

  // If not found in the primary location, log it
  console.warn('Could not find price data in the API response', {
    hasFunctionResponse: !!data?.functionResponse,
    hasValuation: !!data?.functionResponse?.valuation,
    topLevelKeys: Object.keys(data || {})
  });
  
  // Return empty object if no valid price data found
  return {};
}

/**
 * Calculates base price from price data
 * This uses the standard formula of (min + median) / 2
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  // First check if we have the minimum requirements for calculation
  if (!priceData.price_min && !priceData.price_med) {
    console.warn('Missing required price data for base price calculation', priceData);
    return 0;
  }

  // Both values must be present for an accurate calculation
  if (priceData.price_min === undefined || priceData.price_med === undefined) {
    console.warn('Incomplete price data for base price calculation', priceData);
    return 0;
  }

  const minPrice = Number(priceData.price_min);
  const medPrice = Number(priceData.price_med);

  // Validate the numbers before calculation
  if (isNaN(minPrice) || isNaN(medPrice) || minPrice <= 0 || medPrice <= 0) {
    console.warn('Invalid price values for calculation', { minPrice, medPrice });
    return 0;
  }

  const basePrice = (minPrice + medPrice) / 2;
  console.log(`Calculated base price: ${basePrice} from min: ${minPrice}, med: ${medPrice}`);
  
  return basePrice;
}

