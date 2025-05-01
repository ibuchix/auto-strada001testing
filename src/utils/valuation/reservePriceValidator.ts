
/**
 * Reserve price validator utility
 * Created: 2025-05-21 - Added to validate reserve price against our pricing model
 */

import { calculateReservePrice } from './reservePriceCalculator';

/**
 * Calculate the percentage discount tier for a given base price
 */
function getPercentageTier(basePrice: number): {
  percentage: number;
  tier: string;
} {
  if (basePrice <= 15000) return { percentage: 0.65, tier: "0 – 15,000 PLN" };
  else if (basePrice <= 20000) return { percentage: 0.46, tier: "15,001 – 20,000 PLN" };
  else if (basePrice <= 30000) return { percentage: 0.37, tier: "20,001 – 30,000 PLN" };
  else if (basePrice <= 50000) return { percentage: 0.27, tier: "30,001 – 50,000 PLN" };
  else if (basePrice <= 60000) return { percentage: 0.27, tier: "50,001 – 60,000 PLN" };
  else if (basePrice <= 70000) return { percentage: 0.22, tier: "60,001 – 70,000 PLN" };
  else if (basePrice <= 80000) return { percentage: 0.23, tier: "70,001 – 80,000 PLN" };
  else if (basePrice <= 100000) return { percentage: 0.24, tier: "80,001 – 100,000 PLN" };
  else if (basePrice <= 130000) return { percentage: 0.20, tier: "100,001 – 130,000 PLN" };
  else if (basePrice <= 160000) return { percentage: 0.185, tier: "130,001 – 160,000 PLN" };
  else if (basePrice <= 200000) return { percentage: 0.22, tier: "160,001 – 200,000 PLN" };
  else if (basePrice <= 250000) return { percentage: 0.17, tier: "200,001 – 250,000 PLN" };
  else if (basePrice <= 300000) return { percentage: 0.18, tier: "250,001 – 300,000 PLN" };
  else if (basePrice <= 400000) return { percentage: 0.18, tier: "300,001 – 400,000 PLN" };
  else if (basePrice <= 500000) return { percentage: 0.16, tier: "400,001 – 500,000 PLN" };
  else return { percentage: 0.145, tier: "500,001+ PLN" };
}

/**
 * Validate if a provided reserve price matches our expected calculation
 * @param basePrice The base price used for calculation
 * @param providedReservePrice The reserve price to validate against our formula
 * @returns Validation result with details about any discrepancies
 */
export function validateReservePrice(basePrice: number, providedReservePrice: number) {
  // Tolerance for rounding errors (in PLN)
  const TOLERANCE = 5;
  
  // Get the applicable percentage tier
  const { percentage, tier } = getPercentageTier(basePrice);
  
  // Calculate the expected reserve price using our formula
  const expectedReservePrice = calculateReservePrice(basePrice);
  
  // Calculate the absolute discrepancy
  const discrepancy = providedReservePrice - expectedReservePrice;
  
  // Calculate the discrepancy as a percentage
  const discrepancyPercent = Math.abs(discrepancy) / expectedReservePrice * 100;
  
  // Determine if the provided price is within tolerance
  const isValid = Math.abs(discrepancy) <= TOLERANCE;
  
  return {
    isValid,
    basePrice,
    providedReservePrice,
    expectedReservePrice,
    discrepancy,
    discrepancyPercent,
    priceTier: tier,
    appliedPercentage: percentage * 100,
    tolerance: TOLERANCE
  };
}
