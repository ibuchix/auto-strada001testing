
/**
 * Validation types
 * Created: 2025-04-19
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export type TransmissionType = 'manual' | 'automatic';

export interface ValuationData {
  make: string;
  model: string;
  year: number;
  vin: string;
  mileage: number;
  transmission?: TransmissionType;
  valuation?: number;
  reservePrice?: number;
  basePrice?: number;
}
