export interface ManualValuationRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
}

export interface ValuationResponse {
  make: string;
  model: string;
  year: number;
  transmission: string;
  valuation: number;
  mileage: number;
}