
/**
 * Vehicle valuation calculator utilities
 * Updated: 2025-05-01 - Now imports the central reserve price calculator
 */

import { calculateReservePrice as centralCalculateReservePrice, formatPrice } from './reservePriceCalculator';

/**
 * Calculates the reserve price based on the base price of a vehicle
 * @param basePrice - The base price of the vehicle in PLN
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  return centralCalculateReservePrice(basePrice);
}

/**
 * Formats a price as a currency string in PLN
 * @param price - The price to format
 * @returns Formatted price string
 */
export { formatPrice };

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
