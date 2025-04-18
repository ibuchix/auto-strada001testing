
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
      return {
        normalizedData: defaultNormalizedData,
        hasError: false,
        shouldShowError: false,
        hasValuation: false
      };
    }

    // Normalize data to handle missing fields
    const normalizedData: ValuationData = {
      make: valuationResult.make || '',
      model: valuationResult.model || '',
      year: valuationResult.year || new Date().getFullYear(),
      vin: valuationResult.vin || '',
      mileage: 0,  // We'll get this from localStorage
      transmission: (valuationResult.transmission === 'manual' || valuationResult.transmission === 'automatic') 
        ? valuationResult.transmission 
        : 'manual',
      
      valuation: valuationResult.valuation || 0,
      reservePrice: valuationResult.reservePrice || valuationResult.valuation || 0,
      averagePrice: valuationResult.averagePrice || 0,
      
      isExisting: valuationResult.isExisting || false,
      error: valuationResult.error || '',
      noData: valuationResult.noData || false
    };
    
    const hasError = !!normalizedData.error || normalizedData.noData;
    const shouldShowError = hasError && !normalizedData.make && !normalizedData.model;
    const hasValuation = !!(
      normalizedData.make && 
      normalizedData.model && 
      (normalizedData.reservePrice || normalizedData.valuation)
    );

    return {
      normalizedData,
      hasError,
      shouldShowError,
      hasValuation
    };
  }, [valuationResult]);
}
