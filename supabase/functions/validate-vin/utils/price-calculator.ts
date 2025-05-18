
/**
 * Price calculator for validate-vin edge function
 * Created: 2025-05-18 - Based on centralized price calculation logic
 */

import { logOperation } from './logging.ts';

/**
 * Calculate reserve price based on the base price and percentage tier
 * @param basePrice The base vehicle price
 * @param requestId Request ID for logging
 * @returns The calculated reserve price
 */
export function calculateReservePrice(basePrice: number, requestId?: string): number {
  try {
    if (basePrice <= 0) {
      logOperation('reserve_price_error', { 
        requestId, 
        basePrice,
        error: 'Invalid base price' 
      }, 'warn');
      return 0;
    }
    
    let percentageY: number;
    
    // Determine appropriate percentage based on price tier
    if (basePrice <= 15000) {
      percentageY = 0.65;
    } else if (basePrice <= 20000) {
      percentageY = 0.46;
    } else if (basePrice <= 30000) {
      percentageY = 0.37;
    } else if (basePrice <= 50000) {
      percentageY = 0.27;
    } else if (basePrice <= 60000) {
      percentageY = 0.27;
    } else if (basePrice <= 70000) {
      percentageY = 0.22;
    } else if (basePrice <= 80000) {
      percentageY = 0.23;
    } else if (basePrice <= 100000) {
      percentageY = 0.24;
    } else if (basePrice <= 130000) {
      percentageY = 0.20;
    } else if (basePrice <= 160000) {
      percentageY = 0.185;
    } else if (basePrice <= 200000) {
      percentageY = 0.22;
    } else if (basePrice <= 250000) {
      percentageY = 0.17;
    } else if (basePrice <= 300000) {
      percentageY = 0.18;
    } else if (basePrice <= 400000) {
      percentageY = 0.18;
    } else if (basePrice <= 500000) {
      percentageY = 0.16;
    } else {
      percentageY = 0.145;
    }
    
    // Calculate reserve price: PriceX - (PriceX * PercentageY)
    const reservePrice = Math.round(basePrice - (basePrice * percentageY));
    
    if (requestId) {
      logOperation('reserve_price_calculated', { 
        requestId, 
        basePrice, 
        percentageY, 
        reservePrice 
      });
    }
    
    return reservePrice;
  } catch (error) {
    if (requestId) {
      logOperation('reserve_price_calculation_error', { 
        requestId, 
        basePrice,
        error: error.message 
      }, 'error');
    }
    
    // Fallback calculation - use 70% of base price
    return Math.round(basePrice * 0.7);
  }
}
