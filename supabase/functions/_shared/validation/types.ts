
/**
 * Common validation types
 * Created: 2025-04-19
 */

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
};

export type TransmissionType = 'manual' | 'automatic' | undefined;

export interface ValuationData {
  vin: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission?: TransmissionType;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
}

export interface ValidationOptions {
  requireAllFields?: boolean;
  allowPartialData?: boolean;
}
