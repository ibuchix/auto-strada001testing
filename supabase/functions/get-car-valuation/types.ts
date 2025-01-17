export interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: 'manual' | 'automatic';
  isManualEntry?: boolean;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface VehicleDetails {
  make: string;
  model: string;
  year: number | string;
  transmission?: string;
  fuel_type?: string;
}

export interface ValuationResponse {
  make: string;
  model: string;
  year: number;
  vin: string;
  transmission: string;
  valuation?: number;
  averagePrice?: number;
  mileage: number;
  rawDetails?: any;
  rawValuation?: any;
}

export interface ErrorResponse {
  success: boolean;
  message: string;
  error?: any;
  timestamp: string;
}