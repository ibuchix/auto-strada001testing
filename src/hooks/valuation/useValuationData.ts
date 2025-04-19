
/**
 * Changes made:
 * - 2025-04-19: Added proper TypeScript types
 * - 2025-04-19: Improved error handling and data validation
 * - 2025-04-19: Enhanced logging for debugging
 * - 2025-04-23: Fixed type conflicts between different ValuationData interfaces
 */

import { useMemo } from 'react';
import { normalizeValuationData } from '@/utils/valuation/valuationDataNormalizer';
import { ValuationData, ValuationResult } from './types/valuationTypes';

export const useValuationData = (valuationResult: Partial<ValuationData> | null): ValuationResult => {
  return useMemo(() => {
    // Default empty state
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
        hasValuation: false,
        hasPricingData: false
      };
    }
    
    // Check for explicit errors
    const hasError = !!valuationResult.error || !!valuationResult.noData;
    const shouldShowError = hasError;
    
    // Normalize the data to ensure consistent format
    // Cast the result to our ValuationData type to ensure TypeScript compatibility
    const normalizedData = normalizeValuationData(valuationResult) as ValuationData;
    
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
    
    // The vehicle valuation is valid if we have basic vehicle details
    const hasValuation = !hasError && 
      normalizedData.make && 
      normalizedData.model && 
      normalizedData.year > 0;
    
    // Check if we have any pricing data
    const hasPricingData = normalizedData.reservePrice > 0 || normalizedData.valuation > 0;
    
    // Log warning if we have vehicle details but no pricing
    if (!hasPricingData && hasValuation) {
      console.warn('Vehicle has valid details but no pricing data:', {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        vin: normalizedData.vin
      });
    }
      
    return {
      normalizedData,
      hasError,
      shouldShowError,
      hasValuation,
      hasPricingData
    };
  }, [valuationResult]);
};
