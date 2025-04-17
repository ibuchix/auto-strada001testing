
/**
 * Hook for processing and validating valuation data
 * Created: 2025-04-17
 */

import { useState, useEffect } from 'react';
import { normalizeValuationData } from '@/components/hero/valuation/utils/valuationDataNormalizer';
import { toast } from 'sonner';

interface ValuationData {
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

export const useValuationData = (rawData: ValuationData | null) => {
  const [normalizedData, setNormalizedData] = useState<ValuationData>({});
  const [hasError, setHasError] = useState(false);
  const [shouldShowError, setShouldShowError] = useState(false);

  useEffect(() => {
    if (!rawData) {
      setNormalizedData({});
      return;
    }

    // Normalize and process the data
    const normalized = normalizeValuationData(rawData);
    setNormalizedData(normalized);

    // Check for valid vehicle identification
    const hasValidVehicle = normalized.make && normalized.model;
    const hasError = !!rawData.error;
    const shouldShowError = (hasError || (rawData.noData && !hasValidVehicle));

    setHasError(hasError);
    setShouldShowError(shouldShowError);

    // Log processing results
    console.log('Valuation data processed:', {
      hasValidVehicle,
      hasError,
      shouldShowError,
      make: normalized.make,
      model: normalized.model,
      valuation: normalized.valuation,
      reservePrice: normalized.reservePrice
    });
  }, [rawData]);

  return {
    normalizedData,
    hasError,
    shouldShowError,
    hasValuation: !hasError && (
      normalizedData.valuation !== undefined || 
      normalizedData.reservePrice !== undefined
    )
  };
};
