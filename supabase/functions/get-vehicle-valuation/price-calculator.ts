
/**
 * Price calculator for vehicle valuations
 * Calculates the reserve price based on the base price
 */
import { logOperation } from "../_shared/logging.ts";

/**
 * Calculate reserve price based on base price
 * @param basePrice Base price (average of min and median prices)
 * @param requestId Request ID for tracking
 * @returns Reserve price
 */
export function calculateReservePrice(basePrice: number, requestId: string): number {
  try {
    // Define percentage tiers
    const percentageTiers = [
      { min: 0, max: 15000, percentage: 0.65 },
      { min: 15001, max: 20000, percentage: 0.46 },
      { min: 20001, max: 30000, percentage: 0.37 },
      { min: 30001, max: 50000, percentage: 0.27 },
      { min: 50001, max: 60000, percentage: 0.27 },
      { min: 60001, max: 70000, percentage: 0.22 },
      { min: 70001, max: 80000, percentage: 0.23 },
      { min: 80001, max: 100000, percentage: 0.24 },
      { min: 100001, max: 130000, percentage: 0.20 },
      { min: 130001, max: 160000, percentage: 0.185 },
      { min: 160001, max: 200000, percentage: 0.22 },
      { min: 200001, max: 250000, percentage: 0.17 },
      { min: 250001, max: 300000, percentage: 0.18 },
      { min: 300001, max: 400000, percentage: 0.18 },
      { min: 400001, max: 500000, percentage: 0.16 },
      { min: 500001, max: Infinity, percentage: 0.145 }
    ];
    
    // Find applicable tier
    const tier = percentageTiers.find(t => basePrice >= t.min && basePrice <= t.max);
    const percentage = tier ? tier.percentage : 0.145; // Default to 14.5% if no tier found
    
    // Calculate reserve price
    const reservePrice = basePrice - (basePrice * percentage);
    
    // Log calculation
    logOperation('reserve_price_calculation', {
      requestId,
      basePrice,
      percentage: percentage * 100,
      reservePrice
    });
    
    // Round to nearest whole number
    return Math.round(reservePrice);
  } catch (err) {
    // Log error and return fallback value
    logOperation('reserve_price_error', {
      requestId,
      error: err.message,
      basePrice
    }, 'error');
    
    // Fallback to 70% of base price if calculation fails
    return Math.round(basePrice * 0.7);
  }
}
