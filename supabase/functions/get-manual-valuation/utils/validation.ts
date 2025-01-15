import { FuelType, CountryCode, TransmissionType, ManualValuationRequest, ValidationResult } from '../types/validation.ts';

export function normalizeData(data: any): Partial<ManualValuationRequest> {
  console.log('Normalizing data:', data);
  return {
    make: String(data.make || '').trim(),
    model: String(data.model || '').trim(),
    year: Number(data.year),
    mileage: Number(data.mileage),
    transmission: String(data.transmission || '').toLowerCase().trim() as TransmissionType,
    fuel: String(data.fuel || '').toLowerCase().trim() as FuelType,
    country: String(data.country || '').toUpperCase().trim() as CountryCode,
  };
}

export function validateRequest(data: Partial<ManualValuationRequest>): ValidationResult {
  console.log('Validating normalized data:', data);
  const errors: string[] = [];

  // Required field checks
  if (!data.make?.trim()) errors.push('Make is required');
  if (!data.model?.trim()) errors.push('Model is required');
  
  // Year validation
  if (!data.year || isNaN(data.year) || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push('Invalid year');
  }

  // Mileage validation
  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    errors.push('Invalid mileage');
  }

  // Enum validations
  if (!Object.values(TransmissionType).includes(data.transmission as TransmissionType)) {
    errors.push('Invalid transmission type');
  }

  if (!Object.values(FuelType).includes(data.fuel as FuelType)) {
    errors.push('Invalid fuel type');
    console.log('Available fuel types:', Object.values(FuelType));
    console.log('Received fuel type:', data.fuel);
  }

  if (!Object.values(CountryCode).includes(data.country as CountryCode)) {
    errors.push('Invalid country code');
    console.log('Available country codes:', Object.values(CountryCode));
    console.log('Received country:', data.country);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}