
/**
 * Price calculator for vehicle valuations
 * Handles all reserve price calculations based on business rules
 */

import { logOperation } from "../_shared/logging.ts";

/**
 * Calculate the reserve price based on the base price and pricing tiers
 * @param basePrice The base price of the vehicle
 * @param requestId The request ID for logging
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId: string): number {
  // Log the calculation request
  logOperation('calculate_reserve_price', { 
    requestId, 
    basePrice
  });
  
  // Determine percentage reduction based on price tier
  let percentageReduction = 0;
  
  if (basePrice <= 15000) {
    percentageReduction = 0.65;  // 65%
  } else if (basePrice <= 20000) {
    percentageReduction = 0.46;  // 46%
  } else if (basePrice <= 30000) {
    percentageReduction = 0.37;  // 37%
  } else if (basePrice <= 50000) {
    percentageReduction = 0.27;  // 27%
  } else if (basePrice <= 60000) {
    percentageReduction = 0.27;  // 27%
  } else if (basePrice <= 70000) {
    percentageReduction = 0.22;  // 22%
  } else if (basePrice <= 80000) {
    percentageReduction = 0.23;  // 23%
  } else if (basePrice <= 100000) {
    percentageReduction = 0.24;  // 24%
  } else if (basePrice <= 130000) {
    percentageReduction = 0.20;  // 20%
  } else if (basePrice <= 160000) {
    percentageReduction = 0.185; // 18.5%
  } else if (basePrice <= 200000) {
    percentageReduction = 0.22;  // 22%
  } else if (basePrice <= 250000) {
    percentageReduction = 0.17;  // 17%
  } else if (basePrice <= 300000) {
    percentageReduction = 0.18;  // 18%
  } else if (basePrice <= 400000) {
    percentageReduction = 0.18;  // 18%
  } else if (basePrice <= 500000) {
    percentageReduction = 0.16;  // 16%
  } else {
    percentageReduction = 0.145; // 14.5%
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
