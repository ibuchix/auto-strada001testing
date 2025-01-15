export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  ELECTRIC = 'electric',
  HYBRID = 'hybrid'
}

export enum CountryCode {
  PL = 'PL',
  DE = 'DE',
  UK = 'UK'
}

export enum TransmissionType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic'
}

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