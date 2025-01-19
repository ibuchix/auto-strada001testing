import { FuelType, CountryCode, TransmissionType } from '../types/database.ts';
import { ManualValuationRequest, ValidationResult } from '../types/validation.ts';

const VALID_FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid'];
const VALID_COUNTRY_CODES: CountryCode[] = ['PL', 'DE', 'UK'];
const VALID_TRANSMISSION_TYPES: TransmissionType[] = ['manual', 'automatic'];

function normalizeString(value: string): string {
  return value.toLowerCase().trim();
}

export function normalizeData(data: any): Partial<ManualValuationRequest> {
  console.log('Starting data normalization for:', JSON.stringify(data, null, 2));
  
  const normalized = {
    make: String(data.make || '').trim(),
    model: String(data.model || '').trim(),
    year: Number(data.year),
    mileage: Number(data.mileage),
    transmission: normalizeString(String(data.transmission || '')),
    fuel: normalizeString(String(data.fuel || 'petrol')),
    country: String(data.country || 'PL').toUpperCase().trim(),
  };
  
  console.log('Normalized data:', JSON.stringify(normalized, null, 2));
  return normalized;
}

export function validateRequest(data: Partial<ManualValuationRequest>): ValidationResult {
  console.log('Starting validation for:', JSON.stringify(data, null, 2));
  const errors: string[] = [];

  // Required field checks with detailed validation
  if (!data.make?.trim()) {
    errors.push('Make is required');
  } else if (data.make.length < 2 || data.make.length > 50) {
    errors.push('Make must be between 2 and 50 characters');
  }
  
  if (!data.model?.trim()) {
    errors.push('Model is required');
  } else if (data.model.length < 1 || data.model.length > 50) {
    errors.push('Model must be between 1 and 50 characters');
  }
  
  const currentYear = new Date().getFullYear();
  if (!data.year) {
    errors.push('Year is required');
  } else if (isNaN(data.year) || data.year < 1900 || data.year > currentYear + 1) {
    errors.push(`Year must be between 1900 and ${currentYear + 1}`);
  }

  if (!data.mileage && data.mileage !== 0) {
    errors.push('Mileage is required');
  } else if (isNaN(data.mileage) || data.mileage < 0 || data.mileage > 999999) {
    errors.push('Mileage must be between 0 and 999,999 km');
  }

  const normalizedTransmission = normalizeString(String(data.transmission));
  if (!VALID_TRANSMISSION_TYPES.includes(normalizedTransmission as TransmissionType)) {
    errors.push(`Invalid transmission type. Must be one of: ${VALID_TRANSMISSION_TYPES.join(', ')}`);
  }

  const normalizedFuel = normalizeString(String(data.fuel));
  if (!VALID_FUEL_TYPES.includes(normalizedFuel as FuelType)) {
    errors.push(`Invalid fuel type. Must be one of: ${VALID_FUEL_TYPES.join(', ')}`);
  }

  const normalizedCountry = String(data.country).toUpperCase().trim();
  if (!VALID_COUNTRY_CODES.includes(normalizedCountry as CountryCode)) {
    errors.push(`Invalid country code. Must be one of: ${VALID_COUNTRY_CODES.join(', ')}`);
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  console.log('Validation result:', JSON.stringify(result, null, 2));
  return result;
}