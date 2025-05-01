
/**
 * Utility for validating reserve price calculations
 * Created: 2025-05-18 - Added validation against pricing rules
 */

import { calculateReservePrice } from './reservePriceCalculator';

/**
 * Validates if a given reserve price matches the expected calculation
 * based on the base price and pricing tier logic
 * 
 * @param basePrice The base price used for calculation
 * @param reservePrice The reserve price to validate
 * @param tolerancePercent Tolerance percentage for floating point differences (default: 0.5%)
 * @returns Validation result with details
 */
export function validateReservePrice(
  basePrice: number, 
  reservePrice: number,
  tolerancePercent: number = 0.5
): { 
  isValid: boolean;
  expectedReservePrice: number;
  discrepancy: number;
  discrepancyPercent: number;
  priceTier: string;
  appliedPercentage: number;
} {
  // Calculate what the reserve price should be
  const expectedReservePrice = calculateReservePrice(basePrice);
  
  // Calculate the discrepancy
  const discrepancy = Math.abs(reservePrice - expectedReservePrice);
  const discrepancyPercent = basePrice > 0 ? (discrepancy / basePrice) * 100 : 0;
  
  // Determine if the discrepancy is within tolerance
  const isValid = discrepancyPercent <= tolerancePercent;
  
  // Determine which price tier was used
  let priceTier = '';
  let appliedPercentage = 0;
  
  if (basePrice <= 15000) {
    priceTier = '0 – 15,000 PLN'; 
    appliedPercentage = 65;
  } else if (basePrice <= 20000) {
    priceTier = '15,001 – 20,000 PLN';
    appliedPercentage = 46;
  } else if (basePrice <= 30000) {
    priceTier = '20,001 – 30,000 PLN';
    appliedPercentage = 37;
  } else if (basePrice <= 50000) {
    priceTier = '30,001 – 50,000 PLN';
    appliedPercentage = 27;
  } else if (basePrice <= 60000) {
    priceTier = '50,001 – 60,000 PLN';
    appliedPercentage = 27;
  } else if (basePrice <= 70000) {
    priceTier = '60,001 – 70,000 PLN';
    appliedPercentage = 22;
  } else if (basePrice <= 80000) {
    priceTier = '70,001 – 80,000 PLN';
    appliedPercentage = 23;
  } else if (basePrice <= 100000) {
    priceTier = '80,001 – 100,000 PLN';
    appliedPercentage = 24;
  } else if (basePrice <= 130000) {
    priceTier = '100,001 – 130,000 PLN';
    appliedPercentage = 20;
  } else if (basePrice <= 160000) {
    priceTier = '130,001 – 160,000 PLN';
    appliedPercentage = 18.5;
  } else if (basePrice <= 200000) {
    priceTier = '160,001 – 200,000 PLN';
    appliedPercentage = 22;
  } else if (basePrice <= 250000) {
    priceTier = '200,001 – 250,000 PLN';
    appliedPercentage = 17;
  } else if (basePrice <= 300000) {
    priceTier = '250,001 – 300,000 PLN';
    appliedPercentage = 18;
  } else if (basePrice <= 400000) {
    priceTier = '300,001 – 400,000 PLN';
    appliedPercentage = 18;
  } else if (basePrice <= 500000) {
    priceTier = '400,001 – 500,000 PLN';
    appliedPercentage = 16;
  } else {
    priceTier = '500,001+ PLN';
    appliedPercentage = 14.5;
  }
  
  return {
    isValid,
    expectedReservePrice,
    discrepancy,
    discrepancyPercent,
    priceTier,
    appliedPercentage
  };
}

/**
 * Validates the reserve price from the provided valuation data
 * Handles both nested and flat data structures
 * 
 * @param valuationData The valuation data from API or form
 * @returns Validation result or null if insufficient data
 */
export function validateValuationReservePrice(
  valuationData: any
): { validation: ReturnType<typeof validateReservePrice>; basePrice: number; reservePrice: number } | null {
  // Extract the base price and reserve price, handling different data structures
  const data = valuationData.data || valuationData;
  
  // Try to extract the base price from various possible property names
  const basePrice = data.basePrice || 
                   data.averagePrice || 
                   data.valuation || 
                   ((data.price_min && data.price_med) ? ((data.price_min + data.price_med) / 2) : 0);
  
  // Extract reserve price
  const reservePrice = data.reservePrice || data.reserve_price || 0;
  
  // Ensure we have valid numbers to work with
  if (!basePrice || !reservePrice) {
    return null;
  }
  
  // Validate the reserve price
  const validation = validateReservePrice(basePrice, reservePrice);
  
  return {
    validation,
    basePrice,
    reservePrice
  };
}
