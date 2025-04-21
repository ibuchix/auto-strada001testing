
/**
 * Changes made:
 * - 2025-04-19: Fixed type definitions to match project requirements
 * - 2025-04-19: Made averagePrice optional to match with utils/valuation/valuationDataTypes
 * - 2025-04-19: Added explicit transmission type
 * - 2025-04-24: Added apiSource, errorDetails, and usingFallbackEstimation properties
 */

export interface ValuationData {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: 'manual' | 'automatic';
  mileage: number;
  valuation: number;
  reservePrice: number;
  averagePrice?: number;
  basePrice?: number;
  error?: string;
  noData?: boolean;
  isExisting?: boolean;
  apiSource?: string;
  errorDetails?: string;
  usingFallbackEstimation?: boolean;
}

export interface ValuationResult {
  normalizedData: ValuationData;
  hasError: boolean;
  shouldShowError: boolean;
  hasValuation: boolean;
  hasPricingData: boolean;
}
