
/**
 * Validation functions for valuation data
 * Created: 2025-04-19 - Split from valuationDataNormalizer.ts
 */

import { ValuationData } from "../../types";

export function validateValuationData(data: any): boolean {
  if (!data) return false;
  
  const hasBasicData = Boolean(
    data.make && 
    data.model && 
    data.year
  );
  
  const hasPriceData = Boolean(
    ((data.reservePrice !== undefined) && Number(data.reservePrice) >= 0) || 
    ((data.valuation !== undefined) && Number(data.valuation) >= 0)
  );
  
  const isValid = hasBasicData && hasPriceData;
  
  logValidationResult(isValid, data);
  
  return isValid;
}

function logValidationResult(isValid: boolean, data: Partial<ValuationData>) {
  console.log('Validation result for valuation data:', {
    isValid,
    hasBasicData: Boolean(data.make && data.model && data.year),
    hasPriceData: Boolean(
      (data.reservePrice !== undefined && Number(data.reservePrice) >= 0) ||
      (data.valuation !== undefined && Number(data.valuation) >= 0)
    ),
    make: data.make,
    model: data.model,
    year: data.year,
    reservePrice: data.reservePrice,
    valuation: data.valuation
  });
}
