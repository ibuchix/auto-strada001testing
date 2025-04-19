
/**
 * Type definitions for get-vehicle-valuation
 * Created: 2025-04-19
 */

export interface ValuationData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  mileage?: number;
  transmission?: string;
  price?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  [key: string]: any;
}

export interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
