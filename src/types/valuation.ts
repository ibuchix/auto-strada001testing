
/**
 * Valuation Types
 * Created: 2025-05-12
 * Purpose: Type definitions for valuation data
 */

export interface ValuationResult {
  vin: string;
  mileage: number;
  valuation: number;
  make: string;
  model: string;
  year: number;
  transmission?: 'manual' | 'automatic' | 'semi-automatic';
  reservePrice?: number;
  averagePrice?: number;
  apiSource?: string;
  errorDetails?: string;
}

export type ValuationResultWithErrors = ValuationResult & {
  error?: string;
  noData?: boolean;
  isExisting?: boolean;
};

export interface ValuationResponse {
  success: boolean;
  data?: ValuationResult;
  error?: string;
}
