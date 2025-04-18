
/**
 * Changes made:
 * - 2025-04-18: Created hook to consistently evaluate valuation data quality
 * - 2025-04-18: Added detailed validation checks for pricing data
 */

import { useMemo } from 'react';
import { normalizeValuationData } from '@/utils/valuation/valuationDataNormalizer';

export const useValuationData = (valuationResult: any) => {
  return useMemo(() => {
    if (!valuationResult) {
      return {
        normalizedData: {
          make: '',
          model: '',
          year: 0,
          vin: '',
          transmission: 'manual',
          mileage: 0,
          valuation: 0,
          reservePrice: 0,
          averagePrice: 0
        },
        hasError: false,
        shouldShowError: false,
        hasValuation: false
      };
    }
    
    // Check for explicit errors
    const hasError = !!valuationResult.error || !!valuationResult.noData;
    const shouldShowError = hasError;
    
    // Normalize the data to ensure consistent format
    const normalizedData = normalizeValuationData(valuationResult);
    
    // Log key data points for debugging
    console.log('Valuation data validation:', {
      make: normalizedData.make,
      model: normalizedData.model,
      year: normalizedData.year,
      reservePrice: normalizedData.reservePrice,
      valuation: normalizedData.valuation,
      hasExplicitError: hasError,
      hasMakeModel: !!(normalizedData.make && normalizedData.model),
      hasPricing: !!(normalizedData.reservePrice > 0 || normalizedData.valuation > 0)
    });
    
    // The vehicle valuation is valid if we have:
    // 1. No explicit errors AND
    // 2. Make & model & year data AND
    // 3. Some kind of pricing information (either valuation or reservePrice)
    const hasValuation = !hasError && 
      normalizedData.make && 
      normalizedData.model && 
      normalizedData.year > 0 &&
      (normalizedData.reservePrice > 0 || normalizedData.valuation > 0);
      
    return {
      normalizedData,
      hasError,
      shouldShowError,
      hasValuation
    };
  }, [valuationResult]);
};
