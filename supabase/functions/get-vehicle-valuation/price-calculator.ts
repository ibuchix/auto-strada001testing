
/**
 * Price calculator for vehicle valuations
 * Handles all reserve price calculations based on business rules
 * Updated with improved validation and performance optimizations
 */

import { logOperation } from "../_shared/logging.ts";

/**
 * Price tier configuration defining percentage reductions for different price ranges
 */
interface PriceTier {
  maxPrice: number;
  percentageReduction: number;
}

/**
 * Array of price tiers with their corresponding percentage reductions
 * Ordered from lowest to highest price range
 */
const PRICE_TIERS: PriceTier[] = [
  { maxPrice: 15000, percentageReduction: 0.65 },    // 65%
  { maxPrice: 20000, percentageReduction: 0.46 },    // 46%
  { maxPrice: 30000, percentageReduction: 0.37 },    // 37%
  { maxPrice: 50000, percentageReduction: 0.27 },    // 27%
  { maxPrice: 60000, percentageReduction: 0.27 },    // 27%
  { maxPrice: 70000, percentageReduction: 0.22 },    // 22%
  { maxPrice: 80000, percentageReduction: 0.23 },    // 23%
  { maxPrice: 100000, percentageReduction: 0.24 },   // 24%
  { maxPrice: 130000, percentageReduction: 0.20 },   // 20%
  { maxPrice: 160000, percentageReduction: 0.185 },  // 18.5%
  { maxPrice: 200000, percentageReduction: 0.22 },   // 22%
  { maxPrice: 250000, percentageReduction: 0.17 },   // 17%
  { maxPrice: 300000, percentageReduction: 0.18 },   // 18%
  { maxPrice: 400000, percentageReduction: 0.18 },   // 18%
  { maxPrice: 500000, percentageReduction: 0.16 },   // 16%
];

// Default percentage reduction for prices above the highest tier
const DEFAULT_PERCENTAGE_REDUCTION = 0.145;  // 14.5%

/**
 * Calculate the reserve price based on the base price and pricing tiers
 * @param basePrice The base price of the vehicle
 * @param requestId The request ID for logging
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId: string): number {
  // Validate input
  if (typeof basePrice !== 'number' || isNaN(basePrice)) {
    const error = `Invalid base price: ${basePrice}`;
    logOperation('calculate_reserve_price_error', { 
      requestId, 
      error
    }, 'error');
    return 0;
  }
  
  // Handle negative or zero prices
  if (basePrice <= 0) {
    logOperation('calculate_reserve_price_warning', { 
      requestId, 
      basePrice,
      message: "Non-positive base price provided"
    }, 'warn');
    return 0;
  }

  // Log the calculation request
  logOperation('calculate_reserve_price', { 
    requestId, 
    basePrice
  });
  
  // Find the applicable tier
  let percentageReduction = DEFAULT_PERCENTAGE_REDUCTION;
  
  for (const tier of PRICE_TIERS) {
    if (basePrice <= tier.maxPrice) {
      percentageReduction = tier.percentageReduction;
      break;
    }
  }
  
  // Calculate reserve price: basePrice - (basePrice * percentageReduction)
  const reservePrice = Math.round(basePrice * (1 - percentageReduction));
  
  // Log result for traceability
  logOperation('reserve_price_calculated', { 
    requestId, 
    basePrice,
    percentageReduction,
    reservePrice
  });
  
  return reservePrice;
}
