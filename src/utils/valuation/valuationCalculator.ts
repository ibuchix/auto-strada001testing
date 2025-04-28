
/**
 * Vehicle valuation calculator utilities
 * Created: 2025-05-15 - Implements reserve price calculation based on tiered percentages
 */

/**
 * Calculates the reserve price based on the base price of a vehicle
 * using a tiered percentage system.
 * 
 * Base price (Price X) is calculated as (price_min + price_med) / 2
 * Reserve price is calculated as PriceX – (PriceX x PercentageY)
 * 
 * @param basePrice - The base price of the vehicle in PLN
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  // Default percentage if no range matches
  let percentage = 0.25;

  // Apply the appropriate percentage based on price tiers
  if (basePrice <= 15000) {
    percentage = 0.65;      // 0 – 15,000 PLN = 65%
  } else if (basePrice <= 20000) {
    percentage = 0.46;      // 15,001 – 20,000 PLN = 46%
  } else if (basePrice <= 30000) {
    percentage = 0.37;      // 20,001 – 30,000 PLN = 37%
  } else if (basePrice <= 50000) {
    percentage = 0.27;      // 30,001 – 50,000 PLN = 27%
  } else if (basePrice <= 60000) {
    percentage = 0.27;      // 50,001- 60,000 PLN = 27%
  } else if (basePrice <= 70000) {
    percentage = 0.22;      // 60,001 – 70,000 PLN = 22%
  } else if (basePrice <= 80000) {
    percentage = 0.23;      // 70,001 – 80,000 PLN = 23%
  } else if (basePrice <= 100000) {
    percentage = 0.24;      // 80,001– 100,000 PLN = 24%
  } else if (basePrice <= 130000) {
    percentage = 0.20;      // 100,001- 130,000 PLN = 20%
  } else if (basePrice <= 160000) {
    percentage = 0.185;     // 130,001 – 160,000 PLN = 18.5%
  } else if (basePrice <= 200000) {
    percentage = 0.22;      // 160,001 – 200,000 PLN = 22%
  } else if (basePrice <= 250000) {
    percentage = 0.17;      // 200,001 – 250,000 PLN = 17%
  } else if (basePrice <= 300000) {
    percentage = 0.18;      // 250,001 – 300,000 PLN = 18%
  } else if (basePrice <= 400000) {
    percentage = 0.18;      // 300,001 – 400,000 PLN = 18%
  } else if (basePrice <= 500000) {
    percentage = 0.16;      // 400,001 – 500,000 PLN = 16%
  } else {
    percentage = 0.145;     // 500,001+ = 14.5%
  }
  
  // Calculate reserve price: basePrice - (basePrice * percentage)
  const reservePrice = basePrice - (basePrice * percentage);
  
  // Return the reserve price, rounded to nearest whole number
  return Math.round(reservePrice);
}

/**
 * Formats a price as a currency string in PLN
 * @param price - The price to format
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Calculates the percentage discount from original price to discounted price
 * @param originalPrice - The original price
 * @param discountedPrice - The discounted price
 * @returns The percentage discount (e.g., 25 for 25% off)
 */
export function calculateDiscountPercentage(originalPrice: number, discountedPrice: number): number {
  if (originalPrice <= 0) return 0;
  const percentageOff = ((originalPrice - discountedPrice) / originalPrice) * 100;
  return Math.round(percentageOff);
}
