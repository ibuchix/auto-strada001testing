
/**
 * Changes made:
 * - 2025-04-21: Created utility for validating valuation data
 */

import { ValuationData } from '../valuationDataTypes';

export function validateVehicleData(data: Partial<ValuationData>): boolean {
  const isValid = !!(data.make && data.model && data.year && data.year > 1900);
  
  console.log('[VALIDATOR] Vehicle data validation:', {
    hasMake: !!data.make,
    hasModel: !!data.model,
    hasValidYear: data.year && data.year > 1900,
    isValid
  });
  
  return isValid;
}

export function validatePriceData(data: Partial<ValuationData>): boolean {
  const hasAnyPrice = !!(
    data.valuation || 
    data.reservePrice || 
    data.averagePrice || 
    data.basePrice
  );
  
  console.log('[VALIDATOR] Price data validation:', {
    hasValuation: !!data.valuation,
    hasReservePrice: !!data.reservePrice,
    hasAveragePrice: !!data.averagePrice,
    hasBasePrice: !!data.basePrice,
    isValid: hasAnyPrice
  });
  
  return hasAnyPrice;
}
