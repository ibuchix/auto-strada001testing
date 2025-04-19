
/**
 * Type definitions for handle-car-listing
 * Created: 2025-04-19
 */

export interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox: string;
}

export interface ValuationResponse {
  make?: string;
  model?: string;
  year?: number;
  vin: string;
  mileage: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  transmission: string;
  apiData?: {
    dataSize: number;
    fields: string[];
  };
}
