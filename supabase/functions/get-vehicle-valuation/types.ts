
/**
 * Type definitions for vehicle valuation
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

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
