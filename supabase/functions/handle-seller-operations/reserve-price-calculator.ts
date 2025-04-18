
/**
 * Reserve price calculator for vehicle valuations
 * Created: 2025-04-19 - Extracted from shared module
 */

/**
 * Calculate reserve price based on base price
 * Formula: PriceX – (PriceX x PercentageY)
 * where PercentageY varies based on price range
 */
export function calculateReservePriceFromTable(basePrice: number): number {
  // Get the appropriate percentage based on price range
  const percentageY = getReservePercentage(basePrice);
  
  // Apply the formula: PriceX – (PriceX x PercentageY)
  const reservePrice = basePrice - (basePrice * percentageY);
  
  // Round to nearest whole number
  return Math.round(reservePrice);
}

/**
 * Get the reserve percentage based on price range
 */
function getReservePercentage(basePrice: number): number {
  // Price ranges and corresponding percentages
  if (basePrice <= 15000) return 0.65;
  if (basePrice <= 20000) return 0.46;
  if (basePrice <= 30000) return 0.37;
  if (basePrice <= 50000) return 0.27;
  if (basePrice <= 60000) return 0.27;
  if (basePrice <= 70000) return 0.22;
  if (basePrice <= 80000) return 0.23;
  if (basePrice <= 100000) return 0.24;
  if (basePrice <= 130000) return 0.20;
  if (basePrice <= 160000) return 0.185;
  if (basePrice <= 200000) return 0.22;
  if (basePrice <= 250000) return 0.17;
  if (basePrice <= 300000) return 0.18;
  if (basePrice <= 400000) return 0.18;
  if (basePrice <= 500000) return 0.16;
  return 0.145; // 500,001+
}
