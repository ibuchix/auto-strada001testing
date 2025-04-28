
/**
 * Type definitions for valuation data
 * Created: 2025-04-28
 */

export type TransmissionType = 'manual' | 'automatic' | 'semi-automatic' | 'cvt';

export interface ValuationData {
  vin: string;
  make: string;
  model: string;
  year: number;
  transmission: TransmissionType;
  mileage: number;
  valuation: number;
  reservePrice: number;
  averagePrice: number;
  basePrice: number;
  engineCapacity?: string;
  cached?: boolean;
  error?: string;
  noData?: boolean;
  apiSource?: string;
  errorDetails?: string;
}
