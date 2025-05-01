
/**
 * Price utility functions
 * Updated: 2025-05-01 - Now uses centralized reserve price calculator
 */

import { extractNestedPriceData, calculateBasePriceFromNested } from './extraction/pricePathExtractor';
import { calculateReservePrice as centralCalculateReservePrice, formatPrice as centralFormatPrice } from './valuation/reservePriceCalculator';

/**
 * Format a price value for display
 * @param price The price to format
 * @param currency The currency code (default: PLN)
 */
export function formatPrice(price: number, currency: string = 'PLN'): string {
  return centralFormatPrice(price, currency);
}

/**
 * Format a price as currency
 * Alias of formatPrice for backward compatibility
 */
export function formatCurrency(price: number, currency: string = 'PLN'): string {
  return formatPrice(price, currency);
}

/**
 * Calculate reserve price based on base price using tiered percentage discounts
 * @param basePrice The base price to calculate reserve price from
 */
export function calculateReservePrice(basePrice: number): number {
  return centralCalculateReservePrice(basePrice);
}

/**
 * Extract price from API response data
 * Delegates to pricePathExtractor for actual extraction
 * @deprecated Use extractNestedPriceData from pricePathExtractor directly
 */
export function extractPrice(data: any): number | null {
  // Extract nested price data using the imported function
  const priceData = extractNestedPriceData(data);
  // Calculate base price from the extracted data
  return calculateBasePriceFromNested(priceData);
}

/**
 * Re-export the core price extraction utilities
 * This maintains backward compatibility while consolidating imports
 */
export { 
  extractNestedPriceData, 
  calculateBasePriceFromNested 
} from './extraction/pricePathExtractor';
