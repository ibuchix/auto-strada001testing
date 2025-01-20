export interface ManualValuationRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel: string;
  country: string;
  capacity?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}