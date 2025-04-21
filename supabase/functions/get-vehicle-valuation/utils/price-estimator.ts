
/**
 * Price estimation utilities for get-vehicle-valuation
 * Created: 2025-04-25 - Added for more accurate fallback price estimation
 */

import { logOperation } from './logging.ts';

/**
 * Estimate a base price based on vehicle make, model and year
 * Used when proper valuation data isn't available from the API
 */
export function estimateBasePriceByModel(make: string, model: string, year: number): number {
  if (!make || !model) return 0;
  
  // Clean and normalize inputs
  const normalizedMake = make.trim().toUpperCase();
  const normalizedModel = model.trim().toUpperCase();
  const age = new Date().getFullYear() - year;
  
  logOperation('estimating_price', {
    normalizedMake,
    normalizedModel,
    year,
    age
  });
  
  // Base estimation tiers by age
  let baseEstimate = 50000; // Default mid-range value
  
  if (age <= 3) baseEstimate = 80000;
  else if (age <= 6) baseEstimate = 60000;
  else if (age <= 10) baseEstimate = 40000;
  else if (age <= 15) baseEstimate = 25000;
  else baseEstimate = 15000;
  
  // Premium make adjustments
  const premiumMakes = ['BMW', 'MERCEDES', 'AUDI', 'PORSCHE', 'LAND ROVER', 'JAGUAR', 'LEXUS'];
  const economyMakes = ['DACIA', 'FIAT', 'HYUNDAI', 'KIA', 'SKODA', 'SEAT'];
  
  if (premiumMakes.includes(normalizedMake)) {
    baseEstimate *= 1.4; // 40% premium
  } else if (economyMakes.includes(normalizedMake)) {
    baseEstimate *= 0.8; // 20% discount
  }
  
  // Calculate final price (rounded to nearest 1000)
  const estimatedPrice = Math.round(baseEstimate / 1000) * 1000;
  
  logOperation('estimated_price', { 
    make: normalizedMake,
    model: normalizedModel,
    year,
    baseEstimate,
    finalEstimate: estimatedPrice
  });
  
  return estimatedPrice;
}
