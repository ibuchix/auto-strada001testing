
/**
 * Type definitions for valuation data
 * Updated: 2025-04-22 - Added more complete type definitions
 */

export type TransmissionType = 'manual' | 'automatic';

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
  
  // Metadata
  apiSource?: string;
  valuationDate?: string;
  
  // Status flags
  error?: string;
  noData?: boolean;
  isExisting?: boolean;
}

export interface ValuationApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}
