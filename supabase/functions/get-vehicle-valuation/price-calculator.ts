
/**
 * Service for calculating reserve prices based on valuation
 */
import { logOperation } from "../_shared/logging.ts";

// Defines the price tiers and corresponding discount percentages
interface PriceTier {
  min: number;
  max: number;
  percentage: number;
}

// Define the price tiers with their respective discount percentages
const PRICE_TIERS: PriceTier[] = [
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
  { min: 500001, max: Number.MAX_SAFE_INTEGER, percentage: 0.145 }
];

/**
 * Calculate the reserve price based on the base price
 * @param basePrice The base price (average of min and median)
 * @param requestId Request ID for tracking
 * @returns Calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId: string): number {
  try {
    // Input validation
    if (typeof basePrice !== 'number' || isNaN(basePrice) || basePrice < 0) {
      logOperation('price_calculation_error', {
        requestId,
        error: 'Invalid base price',
        basePrice
      }, 'error');
      return 0;
    }
    
    // Find the appropriate tier based on the base price
    const tier = PRICE_TIERS.find(t => basePrice >= t.min && basePrice <= t.max);
    
    // Default to the highest tier if no match is found
    const percentage = tier ? tier.percentage : PRICE_TIERS[PRICE_TIERS.length - 1].percentage;
    
    // Calculate reserve price: PriceX – ( PriceX x PercentageY)
    const reservePrice = Math.round(basePrice - (basePrice * percentage));
    
    // Log the calculation
    logOperation('price_calculation', {
      requestId,
      basePrice,
      percentage,
      reservePrice,
      tier: tier ? `${tier.min}-${tier.max}` : '500001+'
    });
    
    return reservePrice;
  } catch (err) {
    // Log error and return 0
    logOperation('price_calculation_error', {
      requestId,
      error: err.message,
      stack: err.stack,
      basePrice
    }, 'error');
    
    return 0;
  }
}
