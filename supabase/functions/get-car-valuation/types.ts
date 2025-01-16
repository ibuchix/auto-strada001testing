export interface ValuationRequest {
  vin: string;
  mileage: number;
  gearbox?: string;
  isManualEntry?: boolean;
}

export interface ValuationResponse {
  make: string;
  model: string;
  year: number | null;
  vin: string;
  transmission: string;
  valuation: number | null;
  averagePrice: number | null;
  mileage: number;
  rawDetails?: any;
  rawValuation?: any;
}