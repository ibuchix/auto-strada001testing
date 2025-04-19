
/**
 * Price calculation utilities for get-vehicle-valuation
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { logOperation } from './logging.ts';

/**
 * Calculate the reserve price based on base price using the tiered percentage formula
 * 
 * @param basePrice The base price used for calculation
 * @param requestId For logging
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId?: string): number {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    if (requestId) {
      logOperation('reserve_price_calculation_error', {
        requestId,
        error: 'Invalid base price',
        basePrice
      }, 'error');
    }
    return 0;
  }
  
  // Determine percentage based on price tier
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
  
  // Apply formula: PriceX – (PriceX x PercentageY)
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  if (requestId) {
    logOperation('reserve_price_calculated', {
      requestId,
      basePrice,
      percentage,
      formula: `${basePrice} - (${basePrice} × ${percentage})`,
      reservePrice
    });
  }
  
  return reservePrice;
}

/**
 * Extract the best available price from a valuation response
 * with multiple fallback options
 */
export function extractBestPrice(data: any, requestId?: string): number {
  if (!data) return 0;
  
  const priceOptions = [
    data.price,
    data.valuation,
    data.estimatedValue,
    data.marketValue,
    data.averagePrice
  ];
  
  // Filter valid numeric prices and find the highest one
  const validPrices = priceOptions
    .filter(p => typeof p === 'number' && p > 0)
    .sort((a, b) => b - a);
    
  const bestPrice = validPrices[0] || 0;
  
  if (requestId && bestPrice > 0) {
    logOperation('best_price_extracted', {
      requestId,
      bestPrice,
      availableOptions: priceOptions.filter(p => typeof p === 'number' && p > 0)
    });
  }
  
  return bestPrice;
}
