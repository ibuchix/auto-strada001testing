
/**
 * Price utility functions
 * Created: 2025-04-23
 * Consolidated price extraction and calculation utilities
 */

import { calculateBasePriceFromNested } from './extraction/pricePathExtractor';

/**
 * Format a price value for display
 * @param price The price to format
 * @param currency The currency code (default: PLN)
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
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    return 0;
  }
  
  let percentageDiscount;
  
  // Determine percentage based on price tier
  if (basePrice <= 15000) percentageDiscount = 0.65;
  else if (basePrice <= 20000) percentageDiscount = 0.46;
  else if (basePrice <= 30000) percentageDiscount = 0.37;
  else if (basePrice <= 50000) percentageDiscount = 0.27;
  else if (basePrice <= 60000) percentageDiscount = 0.27;
  else if (basePrice <= 70000) percentageDiscount = 0.22;
  else if (basePrice <= 80000) percentageDiscount = 0.23;
  else if (basePrice <= 100000) percentageDiscount = 0.24;
  else if (basePrice <= 130000) percentageDiscount = 0.20;
  else if (basePrice <= 160000) percentageDiscount = 0.185;
  else if (basePrice <= 200000) percentageDiscount = 0.22;
  else if (basePrice <= 250000) percentageDiscount = 0.17;
  else if (basePrice <= 300000) percentageDiscount = 0.18;
  else if (basePrice <= 400000) percentageDiscount = 0.18;
  else if (basePrice <= 500000) percentageDiscount = 0.16;
  else percentageDiscount = 0.145; // 500,001+
  
  return Math.round(basePrice - (basePrice * percentageDiscount));
}

/**
 * Extract price from API response data
 * Delegates to pricePathExtractor for actual extraction
 * @deprecated Use extractNestedPriceData from pricePathExtractor directly
 */
export function extractPrice(data: any): number {
  // Extract nested price data
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

