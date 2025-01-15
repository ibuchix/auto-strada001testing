import { FuelType, CountryCode, TransmissionType } from '../types/database.ts';
import { ManualValuationRequest, ValidationResult } from '../types/validation.ts';

const VALID_FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid'];
const VALID_COUNTRY_CODES: CountryCode[] = ['PL', 'DE', 'UK'];
const VALID_TRANSMISSION_TYPES: TransmissionType[] = ['manual', 'automatic'];

export function normalizeData(data: any): Partial<ManualValuationRequest> {
  console.log('Starting data normalization for:', JSON.stringify(data, null, 2));
  
  const normalized = {
    make: String(data.make || '').trim(),
    model: String(data.model || '').trim(),
    year: Number(data.year),
    mileage: Number(data.mileage),
    transmission: String(data.transmission || '').toLowerCase() as TransmissionType,
    fuel: String(data.fuel || '').toLowerCase() as FuelType,
    country: String(data.country || '').toUpperCase() as CountryCode,
  };
  
  console.log('Normalized data:', JSON.stringify(normalized, null, 2));
  return normalized;
}

export function validateRequest(data: Partial<ManualValuationRequest>): ValidationResult {
  console.log('Starting validation for:', JSON.stringify(data, null, 2));
  const errors: string[] = [];

  // Required field checks
  if (!data.make?.trim()) {
    console.log('Make validation failed: empty or missing');
    errors.push('Make is required');
  }
  
  if (!data.model?.trim()) {
    console.log('Model validation failed: empty or missing');
    errors.push('Model is required');
  }
  
  // Year validation
  const currentYear = new Date().getFullYear();
  if (!data.year || isNaN(data.year) || data.year < 1900 || data.year > currentYear + 1) {
    console.log('Year validation failed:', {
      value: data.year,
      isNumber: !isNaN(data.year),
      withinRange: data.year >= 1900 && data.year <= currentYear + 1
    });
    errors.push('Invalid year');
  }

  // Mileage validation
  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    console.log('Mileage validation failed:', {
      value: data.mileage,
      isNumber: !isNaN(data.mileage),
      isPositive: data.mileage >= 0
    });
    errors.push('Invalid mileage');
  }

  // Transmission validation
  if (!data.transmission || !VALID_TRANSMISSION_TYPES.includes(data.transmission)) {
    console.log('Transmission validation failed:', {
      value: data.transmission,
      validOptions: VALID_TRANSMISSION_TYPES
    });
    errors.push('Invalid transmission type');
  }

  // Fuel type validation
  if (!data.fuel || !VALID_FUEL_TYPES.includes(data.fuel)) {
    console.log('Fuel type validation failed:', {
      value: data.fuel,
      validOptions: VALID_FUEL_TYPES,
      isValid: VALID_FUEL_TYPES.includes(data.fuel as FuelType)
    });
    errors.push('Invalid fuel type');
  }

  // Country code validation
  if (!data.country || !VALID_COUNTRY_CODES.includes(data.country)) {
    console.log('Country code validation failed:', {
      value: data.country,
      validOptions: VALID_COUNTRY_CODES,
      isValid: VALID_COUNTRY_CODES.includes(data.country as CountryCode)
    });
    errors.push('Invalid country code');
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  console.log('Validation result:', JSON.stringify(result, null, 2));
  return result;
}