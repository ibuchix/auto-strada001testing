
/**
 * Utility for calculating reserve prices based on vehicle valuation
 */
import { logOperation } from "../_shared/logging.ts";

/**
 * Calculate reserve price using the tiered pricing formula
 * @param basePrice Base price used for calculation (typically average of min and median prices)
 * @param requestId Request ID for tracking
 * @returns Calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId: string): number {
  let percentage = 0;
  
  // Determine percentage based on price range
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
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  // Log calculation for debugging
  logOperation('price_calculation', { 
    requestId, 
    basePrice, 
    percentage, 
    reservePrice 
  });
  
  return reservePrice;
}
