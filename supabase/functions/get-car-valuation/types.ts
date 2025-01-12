export interface ValuationRequest {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  mileage: number;
  gearbox: string;
  isManualEntry?: boolean;
}

export interface ValuationResponse {
  make: string;
  model: string;
  year: number | null;
  vin: string;
  transmission: string;
  valuation: number;
  mileage: number;
}