/**
 * Enhanced Valuation Data Hook
 * Updated: 2025-04-18 - Improved data normalization and error handling
 */

import { useMemo } from 'react';

interface ValuationResultData {
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: string;
  valuation?: number;
  averagePrice?: number;
  reservePrice?: number;
  isExisting?: boolean;
  error?: string;
  noData?: boolean;
}

export function useValuationData(valuationResult: ValuationResultData | null) {
  return useMemo(() => {
    if (!valuationResult) {
      return {
        normalizedData: {},
        hasError: false,
        shouldShowError: false,
        hasValuation: false
      };
    }

    // Detect error conditions
    const hasError = !!valuationResult.error || !!valuationResult.noData;
    const shouldShowError = hasError && !valuationResult.make && !valuationResult.model;
    
    // Normalize data to handle missing fields and ensure consistent property names
    const normalizedData = {
      make: valuationResult.make || '',
      model: valuationResult.model || '',
      year: valuationResult.year || new Date().getFullYear(),
      vin: valuationResult.vin || '',
      transmission: valuationResult.transmission || 'manual',
      
      // Ensure we have a valid reserve price
      reservePrice: valuationResult.reservePrice || valuationResult.valuation || 0,
      
      // Ensure we have a valid average price
      averagePrice: valuationResult.averagePrice || 
                    (valuationResult.reservePrice && valuationResult.reservePrice > 0 ? 
                      Math.round(valuationResult.reservePrice * 1.5) : 0),
      
      // Keep error information
      error: valuationResult.error || (valuationResult.noData ? 'No data found for this VIN' : ''),
      isExisting: valuationResult.isExisting || false
    };
    
    // Determine if we have valid valuation data
    const hasValuation = !!(
      normalizedData.make && 
      normalizedData.model && 
      normalizedData.reservePrice && 
      normalizedData.reservePrice > 0
    );
    
    // Log the normalized data for debugging
    console.log('Normalized valuation data:', {
      original: {
        make: valuationResult.make,
        model: valuationResult.model,
        year: valuationResult.year,
        reservePrice: valuationResult.reservePrice,
        valuation: valuationResult.valuation,
        averagePrice: valuationResult.averagePrice
      },
      normalized: {
        make: normalizedData.make,
        model: normalizedData.model,
        year: normalizedData.year,
        reservePrice: normalizedData.reservePrice,
        averagePrice: normalizedData.averagePrice
      },
      hasError,
      shouldShowError,
      hasValuation
    });

    return {
      normalizedData,
      hasError,
      shouldShowError,
      hasValuation
    };
  }, [valuationResult]);
}
