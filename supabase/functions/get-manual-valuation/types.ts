export interface ManualValuationInput {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: 'manual' | 'automatic';
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  country: 'PL' | 'DE' | 'UK';
  capacity?: number;
}

export interface ManualValuationResponse {
  success: boolean;
  message: string;
  data: any;
}