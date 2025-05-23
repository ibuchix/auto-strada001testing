
/**
 * Reserve Price Calculator Utility
 * Created: 2025-05-01
 * Updated: 2025-06-01 - Added proper Polish Zloty formatting and fixed null handling
 * Updated: 2025-06-01 - Removed fallback logic for invalid inputs
 */

/**
 * Calculate the reserve price based on the base price tiers
 * 
 * @param basePrice The base price to calculate from
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  // Input validation
  if (!basePrice || basePrice <= 0) {
    throw new Error("Invalid base price provided");
  }
  
  // Determine percentage based on price tier
  let percentage = 0;
  
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
  
  // Calculate the reserve price: basePrice - (basePrice * percentage)
  const reservePrice = basePrice - (basePrice * percentage);
  
  // Round to nearest whole number
  return Math.round(reservePrice);
}

/**
 * Format price value for display with Polish formatting
 * 
 * @param price The price to format
 * @param currency The currency code (default: PLN)
 */
export function formatPrice(price: number | null | undefined, currency: string = 'PLN'): string {
  // Handle null, undefined, or invalid values
  if (price === null || price === undefined || isNaN(price)) {
    return 'N/A';
  }
  
  // Format with Polish locale for consistent display
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}
