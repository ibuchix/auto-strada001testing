
/**
 * Vehicle valuation calculator utilities
 * Created: 2025-05-11 - Extracted from directValuationService.ts
 */

/**
 * Calculates reserve price based on the base price and pricing tiers
 * @param basePrice Base vehicle price
 * @returns The calculated reserve price
 */
export const calculateReservePrice = (basePrice: number): number => {
  let percentage = 0.25; // Default percentage

  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;

  // Calculate reserve price: PriceX - (PriceX * PercentageY)
  return Math.round(basePrice - (basePrice * percentage));
};

/**
 * Validates price data to ensure we have usable values
 * @param priceData Price data object
 * @returns Validation result
 */
export const validatePriceData = (priceData: any): { 
  isValid: boolean;
  basePrice?: number;
  reservePrice?: number;
  error?: string;
} => {
  if (!priceData) {
    return { isValid: false, error: 'No price data available' };
  }
  
  // Extract base price from various possible sources
  let basePrice = 0;
  if (typeof priceData.basePrice === 'number' && priceData.basePrice > 0) {
    basePrice = priceData.basePrice;
  } else if (typeof priceData.averagePrice === 'number' && priceData.averagePrice > 0) {
    basePrice = priceData.averagePrice;
  } else if (typeof priceData.valuation === 'number' && priceData.valuation > 0) {
    basePrice = priceData.valuation;
  } else {
    // Calculate from price_min and price_med if available
    const priceMin = Number(priceData.price_min || 0);
    const priceMed = Number(priceData.price_med || 0);
    
    if (priceMin > 0 && priceMed > 0) {
      basePrice = (priceMin + priceMed) / 2;
    }
  }
  
  if (basePrice <= 0) {
    return { isValid: false, error: 'Could not determine valid base price' };
  }
  
  // Calculate reserve price
  const reservePrice = calculateReservePrice(basePrice);
  
  return {
    isValid: true,
    basePrice,
    reservePrice
  };
};
