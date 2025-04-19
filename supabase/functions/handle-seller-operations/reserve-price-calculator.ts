
/**
 * Reserve price calculator
 * Created: 2025-04-19
 */

import { logOperation } from "./utils/logging.ts";

/**
 * Calculate reserve price based on base price and price tiers
 * 
 * @param basePrice The base price of the vehicle
 * @returns Calculated reserve price
 */
export function calculateReservePriceFromTable(basePrice: number): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    logOperation('reserve_price_calculation_error', { 
      error: 'Invalid base price',
      basePrice
    }, 'error');
    return 0;
  }

  let percentageDiscount: number;
  
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
  else percentageDiscount = 0.145;
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentageDiscount));
  
  logOperation('reserve_price_calculated', { 
    basePrice,
    percentageDiscount,
    reservePrice
  });
  
  return reservePrice;
}
