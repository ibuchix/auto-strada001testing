
/**
 * Changes made:
 * - 2024-03-20: Fixed transmission type reference
 * - 2024-03-20: Added more complete type definitions
 * - 2024-03-25: Updated TransmissionType to use the database enum
 */

export type TransmissionType = 'manual' | 'automatic';

export interface ValuationData {
  valuation?: number;
  price?: number;
  averagePrice?: number;
  make?: string;
  model?: string;
  year?: number;
  capacity?: number;
  error?: string;
  isExisting?: boolean;
  noData?: boolean;
  vin: string;
  transmission: TransmissionType;
  [key: string]: any;
}

export interface ValuationResult {
  success: boolean;
  data: ValuationData;
}

export interface ValuationState {
  vin: string;
  mileage: string;
  gearbox: TransmissionType;
}
