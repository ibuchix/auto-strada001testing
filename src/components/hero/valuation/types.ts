
/**
 * Changes made:
 * - 2024-03-20: Fixed transmission type reference
 * - 2024-03-20: Added more complete type definitions
 * - 2024-03-25: Updated TransmissionType to use the database enum
 * - 2024-03-26: Fixed TransmissionType to match PostgreSQL enum values
 * - 2024-03-27: Added explicit string type to ensure compatibility with database
 * - 2024-08-01: Made vin and transmission properties optional for caching purposes
 */

// Match the PostgreSQL enum 'car_transmission_type'
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
  vin?: string;  // Made optional for caching purposes
  transmission?: TransmissionType;  // Made optional for caching purposes
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
