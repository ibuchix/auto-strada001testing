import { FuelType, CountryCode, TransmissionType } from './database.ts';

export interface ManualValuationRequest {
  make: string;
  model: string;
  year: number;
  mileage: number;
  transmission: TransmissionType;
  fuel: FuelType;
  country: CountryCode;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}