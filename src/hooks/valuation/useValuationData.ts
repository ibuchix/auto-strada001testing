
/**
 * useValuationData hook
 * Changes made:
 * - Improved type safety and null handling
 * - Enhanced normalization of partial data
 * - 2025-04-21: Made more resilient to handle different property types
 * - 2025-04-22: Added additional fallbacks and logging for better data handling
 * - 2025-04-23: Fixed incorrect access to data property on ValuationResultData
 */

import { useMemo } from 'react';
import { ValuationData } from '@/utils/valuation/valuationDataTypes';

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
    // Log input data for debugging
    console.log('useValuationData input:', {
      hasData: !!valuationResult,
      makePresent: valuationResult?.make ? "yes" : "no",
      modelPresent: valuationResult?.model ? "yes" : "no",
      yearPresent: valuationResult?.year ? "yes" : "no",
      data: valuationResult
    });
    
    // Provide default empty data if nothing is passed
    const defaultNormalizedData: ValuationData = {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      mileage: 0,
      transmission: 'manual',
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0,
      isExisting: false,
      error: '',
      noData: true
    };

    if (!valuationResult) {
      console.log('No valuation result data provided, using defaults');
      return {
        normalizedData: defaultNormalizedData,
        hasError: false,
        shouldShowError: false,
        hasValuation: false
      };
    }

    // Check for nested data structure - checking if it's an object coming directly from an API
    // Don't try to access data property directly - it doesn't exist on the type
    const dataToUse = valuationResult;

    // Check if we have any vehicle data to display
    const hasVehicleData = !!(dataToUse.make || dataToUse.model || (dataToUse.year && dataToUse.year > 0));
    
    // Normalize data to handle missing fields with robust type checking
    const normalizedData: ValuationData = {
      make: dataToUse.make || '',
      model: dataToUse.model || '',
      year: dataToUse.year || new Date().getFullYear(),
      vin: dataToUse.vin || '',
      mileage: 0,  // We'll get this from localStorage
      transmission: (dataToUse.transmission === 'manual' || dataToUse.transmission === 'automatic') 
        ? dataToUse.transmission 
        : 'manual',
      
      valuation: typeof dataToUse.valuation === 'number' ? dataToUse.valuation : 
                 typeof dataToUse.reservePrice === 'number' ? dataToUse.reservePrice : 0,
                 
      reservePrice: typeof dataToUse.reservePrice === 'number' ? dataToUse.reservePrice : 
                   (typeof dataToUse.valuation === 'number' ? dataToUse.valuation : 0),
                   
      averagePrice: typeof dataToUse.averagePrice === 'number' ? dataToUse.averagePrice : 
                   (typeof dataToUse.basePrice === 'number' ? dataToUse.basePrice : 0),
      
      isExisting: !!dataToUse.isExisting,
      error: dataToUse.error || '',
      noData: !!dataToUse.noData || !hasVehicleData
    };
    
    // Log the normalized data for debugging
    console.log('Normalized valuation data in hook:', {
      make: normalizedData.make,
      model: normalizedData.model,
      year: normalizedData.year,
      valuation: normalizedData.valuation,
      reservePrice: normalizedData.reservePrice,
      averagePrice: normalizedData.averagePrice,
      hasVehicleData
    });
    
    const hasError = !!normalizedData.error || normalizedData.noData;
    const shouldShowError = hasError && !normalizedData.make && !normalizedData.model;
    const hasValuation = !!(
      normalizedData.make && 
      normalizedData.model && 
      (typeof normalizedData.reservePrice === 'number' && normalizedData.reservePrice > 0 || 
       typeof normalizedData.valuation === 'number' && normalizedData.valuation > 0)
    );

    return {
      normalizedData,
      hasError,
      shouldShowError,
      hasValuation
    };
  }, [valuationResult]);
}
