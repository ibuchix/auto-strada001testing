
/**
 * Central reserve price calculation utility
 * Created: 2025-05-01 - Consolidated from multiple implementations
 * Updated: 2025-05-20 - Fixed precision issues with percentage calculations
 * Updated: 2025-05-21 - Aligned all reserve price calculations to use consistent formula
 */

/**
 * Calculates the reserve price based on the base price of a vehicle
 * using a tiered percentage system.
 * 
 * Formula: PriceX – (PriceX x PercentageY) where PriceX is the base price
 * and PercentageY varies by price tier
 * 
 * @param basePrice - The base price of the vehicle in PLN
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  // Input validation
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }

  // Determine percentage based on price tier
  let percentageY: number;
  
  if (basePrice <= 15000) percentageY = 0.65;
  else if (basePrice <= 20000) percentageY = 0.46;
  else if (basePrice <= 30000) percentageY = 0.37;
  else if (basePrice <= 50000) percentageY = 0.27;
  else if (basePrice <= 60000) percentageY = 0.27;
  else if (basePrice <= 70000) percentageY = 0.22;
  else if (basePrice <= 80000) percentageY = 0.23;
  else if (basePrice <= 100000) percentageY = 0.24;
  else if (basePrice <= 130000) percentageY = 0.20;
  else if (basePrice <= 160000) percentageY = 0.185;
  else if (basePrice <= 200000) percentageY = 0.22;
  else if (basePrice <= 250000) percentageY = 0.17;
  else if (basePrice <= 300000) percentageY = 0.18;
  else if (basePrice <= 400000) percentageY = 0.18;
  else if (basePrice <= 500000) percentageY = 0.16;
  else percentageY = 0.145; // 500,001+
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = basePrice - (basePrice * percentageY);
  
  // Round to nearest integer
  return Math.round(reservePrice);
}

/**
 * Formats a price value as currency
 * @param price - The price to format
 * @param currency - The currency code (default: PLN)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'PLN'): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Calculates the percentage discount between two price points
 * @param originalPrice - The original price
 * @param discountedPrice - The discounted price
 * @returns The percentage discount (0-100)
 */
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (!originalPrice || originalPrice <= 0) return 0;
  const discountPercent = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(discountPercent);
}

/**
 * Calculates the base price from min and median prices
 * @param priceMin - The minimum price
 * @param priceMed - The median price
 * @returns The calculated base price
 */
export function calculateBasePrice(priceMin: number, priceMed: number): number {
  if (!priceMin || !priceMed || priceMin <= 0 || priceMed <= 0) {
    return 0;
  }
  
  return (priceMin + priceMed) / 2;
}
