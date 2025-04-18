
/**
 * Type definitions for vehicle valuation
 * Created: 2025-04-18
 */

export interface ValuationData {
  vin: string;
  make?: string;
  model?: string;
  year?: number;
  price?: number;
  mileage?: number;
  valuation?: number;
  reservePrice?: number;
}
