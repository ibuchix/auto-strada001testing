
/**
 * Price estimation utilities for get-vehicle-valuation
 * Created: 2025-04-25 - Added for more accurate fallback price estimation
 * Updated: 2025-04-28 - Enhanced logging and validation
 */

import { logOperation } from './logging.ts';

/**
 * Estimate a base price based on vehicle make, model and year
 * Used when proper valuation data isn't available from the API
 */
export function estimateBasePriceByModel(make: string, model: string, year: number, requestId: string): number {
  if (!make || !model) {
    logOperation('estimate_price_insufficient_data', {
      requestId,
      make,
      model,
      year
    }, 'warn');
    return 0;
  }
  
  // Clean and normalize inputs
  const normalizedMake = make.trim().toUpperCase();
  const normalizedModel = model.trim().toUpperCase();
  const age = new Date().getFullYear() - year;
  
  logOperation('estimating_price', {
    requestId,
    normalizedMake,
    normalizedModel,
    year,
    age,
    currentYear: new Date().getFullYear()
  });
  
  // Base estimation tiers by age
  let baseEstimate = 50000; // Default mid-range value
  
  if (age <= 3) baseEstimate = 80000;
  else if (age <= 6) baseEstimate = 60000;
  else if (age <= 10) baseEstimate = 40000;
  else if (age <= 15) baseEstimate = 25000;
  else baseEstimate = 15000;
  
  logOperation('age_based_estimate', {
    requestId,
    age,
    baseEstimate
  });
  
  // Premium make adjustments
  const premiumMakes = ['BMW', 'MERCEDES', 'AUDI', 'PORSCHE', 'LAND ROVER', 'JAGUAR', 'LEXUS'];
  const economyMakes = ['DACIA', 'FIAT', 'HYUNDAI', 'KIA', 'SKODA', 'SEAT'];
  
  let makeAdjustment = 1.0; // Default - no adjustment
  
  if (premiumMakes.includes(normalizedMake)) {
    makeAdjustment = 1.4; // 40% premium
    logOperation('premium_make_adjustment', {
      requestId,
      make: normalizedMake,
      adjustment: '+40%'
    });
  } else if (economyMakes.includes(normalizedMake)) {
    makeAdjustment = 0.8; // 20% discount
    logOperation('economy_make_adjustment', {
      requestId,
      make: normalizedMake,
      adjustment: '-20%'
    });
  }
  
  // Apply make adjustment
  let adjustedEstimate = baseEstimate * makeAdjustment;
  
  // Round to nearest 1000
  const finalEstimate = Math.round(adjustedEstimate / 1000) * 1000;
  
  logOperation('final_price_estimate', {
    requestId,
    make: normalizedMake,
    model: normalizedModel,
    year,
    age,
    baseEstimate,
    makeAdjustment,
    adjustedEstimate,
    finalEstimate
  });
  
  return finalEstimate;
}

/**
 * Get a user-friendly message about the estimation method
 */
export function getEstimationMethodDescription(
  make: string, 
  model: string, 
  year: number, 
  usedEstimation: boolean
): string {
  if (!usedEstimation) {
    return 'Using API valuation data';
  }
  
  if (make && model && year > 0) {
    return `Estimated based on ${make} ${model} (${year})`;
  }
  
  return 'Using default valuation (API data unavailable)';
}
