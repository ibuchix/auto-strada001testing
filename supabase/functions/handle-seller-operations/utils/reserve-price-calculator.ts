
/**
 * Reserve price calculator for handle-seller-operations
 * Created: 2025-04-19 - Extracted from pricing logic
 */

/**
 * Calculate the reserve price based on the valuation price
 * @param valuation Vehicle valuation price
 * @returns Calculated reserve price
 */
export function calculateReservePrice(valuation: number): number {
  // Determine percentage based on price range
  let percentageY;
  
  if (valuation <= 15000) percentageY = 0.65;
  else if (valuation <= 20000) percentageY = 0.46;
  else if (valuation <= 30000) percentageY = 0.37;
  else if (valuation <= 50000) percentageY = 0.27;
  else if (valuation <= 60000) percentageY = 0.27;
  else if (valuation <= 70000) percentageY = 0.22;
  else if (valuation <= 80000) percentageY = 0.23;
  else if (valuation <= 100000) percentageY = 0.24;
  else if (valuation <= 130000) percentageY = 0.20;
  else if (valuation <= 160000) percentageY = 0.185;
  else if (valuation <= 200000) percentageY = 0.22;
  else if (valuation <= 250000) percentageY = 0.17;
  else if (valuation <= 300000) percentageY = 0.18;
  else if (valuation <= 400000) percentageY = 0.18;
  else if (valuation <= 500000) percentageY = 0.16;
  else percentageY = 0.145;
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  return Math.round(valuation - (valuation * percentageY));
}
