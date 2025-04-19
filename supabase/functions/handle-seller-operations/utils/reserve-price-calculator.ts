
/**
 * Reserve price calculator utility
 * Created: 2025-04-19 - Extracted from external-api.ts
 */

/**
 * Calculate reserve price based on the pricing tiers
 * @param basePrice The base price to calculate from
 * @returns The calculated reserve price
 */
export function calculateReservePriceFromTable(basePrice: number): number {
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
  
  return Math.round(basePrice - (basePrice * percentage));
}
