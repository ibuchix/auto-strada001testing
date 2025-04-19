
/**
 * Shared reserve price calculation utilities
 * Created: 2025-04-19
 */

import { logOperation } from './logging.ts';

/**
 * Calculate reserve price based on base price and price tier table
 * 
 * Formula: PriceX – (PriceX x PercentageY) where PriceX is base price
 * and PercentageY varies by price tier
 * 
 * @param basePrice Base price of the vehicle in PLN
 * @returns Calculated reserve price
 */
export function calculateReservePrice(basePrice: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    logOperation('reserve_price_calculation_error', {
      basePrice,
      error: 'Invalid base price'
    }, 'error');
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
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentageDiscount));
  
  logOperation('reserve_price_calculated', {
    basePrice,
    reservePrice,
    percentageDiscount
  });
  
  return reservePrice;
}

/**
 * Get the discount percentage for a given price tier
 * @param basePrice The base price to check against tiers
 * @returns The discount percentage (0-1)
 */
export function getReservePricePercentage(basePrice: number): number {
  if (basePrice <= 15000) return 0.65;
  else if (basePrice <= 20000) return 0.46;
  else if (basePrice <= 30000) return 0.37;
  else if (basePrice <= 50000) return 0.27;
  else if (basePrice <= 60000) return 0.27;
  else if (basePrice <= 70000) return 0.22;
  else if (basePrice <= 80000) return 0.23;
  else if (basePrice <= 100000) return 0.24;
  else if (basePrice <= 130000) return 0.20;
  else if (basePrice <= 160000) return 0.185;
  else if (basePrice <= 200000) return 0.22;
  else if (basePrice <= 250000) return 0.17;
  else if (basePrice <= 300000) return 0.18;
  else if (basePrice <= 400000) return 0.18;
  else if (basePrice <= 500000) return 0.16;
  else return 0.145; // 500,001+
}

/**
 * Calculate the profit margin percentage based on purchase price and selling price
 * @param purchasePrice The price the vehicle was purchased for
 * @param sellingPrice The price the vehicle sold for
 * @returns Profit margin percentage
 */
export function calculateProfitMargin(purchasePrice: number, sellingPrice: number): number {
  if (!purchasePrice || !sellingPrice || purchasePrice <= 0 || sellingPrice <= 0) {
    return 0;
  }
  
  const profit = sellingPrice - purchasePrice;
  const marginPercentage = (profit / purchasePrice) * 100;
  
  return Number(marginPercentage.toFixed(2));
}
