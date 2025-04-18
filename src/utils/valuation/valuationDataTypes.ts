
/**
 * Changes made:
 * - 2025-04-18: Created standardized types for valuation data
 */

export type TransmissionType = "manual" | "automatic";

export interface ValuationResult {
  success: boolean;
  data: ValuationData;
}

export interface ValuationData {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: TransmissionType;
  mileage: number;
  valuation: number;
  reservePrice: number;
  basePrice?: number;
  averagePrice?: number;
  
  // External API metadata
  apiSource?: string;
  valuationDate?: string;
  confidence?: number;
  
  // Status flags
  isExisting?: boolean;
  error?: string;
  noData?: boolean;
}

/**
 * Re-export the calculation function for convenience
 */
export { calculateReservePrice } from './valuationCalculator';
