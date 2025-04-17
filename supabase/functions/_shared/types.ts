
/**
 * Shared type definitions for edge functions
 * Created: 2025-04-17
 */

export type TransmissionType = "manual" | "automatic";

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

export interface ExternalValuationResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  errorCode?: string;
}
