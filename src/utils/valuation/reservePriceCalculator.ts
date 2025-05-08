
/**
 * Changes made:
 * - 2025-05-08: Created utility for consistent reserve price calculation
 * - 2025-05-08: Added formatPrice utility function
 * - 2025-05-08: Added log statements for debugging
 */

/**
 * Calculate reserve price based on the base price and percentage brackets
 * Base price is calculated as (price_min + price_med) / 2
 * 
 * @param basePrice - The base price value
 * @returns calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  console.log(`Calculating reserve price for base price: ${basePrice}`);
  
  // Define percentage brackets
  const brackets = [
    { max: 15000, percentage: 0.65 },
    { max: 20000, percentage: 0.46 },
    { max: 30000, percentage: 0.37 },
    { max: 50000, percentage: 0.27 },
    { max: 60000, percentage: 0.27 },
    { max: 70000, percentage: 0.22 },
    { max: 80000, percentage: 0.23 },
    { max: 100000, percentage: 0.24 },
    { max: 130000, percentage: 0.20 },
    { max: 160000, percentage: 0.185 },
    { max: 200000, percentage: 0.22 },
    { max: 250000, percentage: 0.17 },
    { max: 300000, percentage: 0.18 },
    { max: 400000, percentage: 0.18 },
    { max: 500000, percentage: 0.16 },
    { max: Infinity, percentage: 0.145 }
  ];
  
  // Find the applicable percentage
  const bracket = brackets.find(b => basePrice <= b.max);
  const percentage = bracket ? bracket.percentage : brackets[brackets.length - 1].percentage;
  
  console.log(`Using percentage ${percentage * 100}% for price bracket`);
  
  // Calculate reserve price: BasePrice - (BasePrice * Percentage)
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  console.log(`Calculated reserve price: ${reservePrice}`);
  
  return reservePrice;
}

/**
 * Format price for display with currency
 * 
 * @param price - The price to format
 * @param currency - The currency code (default: PLN)
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'PLN'): string {
  // Format the price with thousand separators
  const formattedPrice = new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
  
  return formattedPrice;
}
