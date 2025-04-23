
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

  // If not found in the primary location, try the backup/flattened data structure
  // This happens in some API response formats or when data is manually structured
  if (data.price || data.price_min || data.price_med) {
    console.log('Found price data in root level:', {
      price: data.price,
      price_min: data.price_min,
      price_med: data.price_med
    });
    
    return {
      price: Number(data.price) || undefined,
      price_min: Number(data.price_min) || undefined,
      price_max: Number(data.price_max) || undefined,
      price_avr: Number(data.price_avr) || undefined,
      price_med: Number(data.price_med) || undefined
    };
  }

  // If we don't find the nested structure, log it
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
    
    // Fallback to price if available
    if (priceData.price) {
      console.log('Using direct price value as fallback', priceData.price);
      return Number(priceData.price);
    }
    
    return 0;
  }

  // Use price_med as fallback for price_min if needed
  const minPrice = priceData.price_min ?? priceData.price_med ?? 0;
  // Use price_min as fallback for price_med if needed
  const medPrice = priceData.price_med ?? priceData.price_min ?? 0;

  const basePrice = (Number(minPrice) + Number(medPrice)) / 2;
  console.log(`Calculated base price: ${basePrice} from min: ${minPrice}, med: ${medPrice}`);
  
  return basePrice;
}
