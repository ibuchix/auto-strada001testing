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
    fuel: normalizeString(String(data.fuel || '')),
    country: String(data.country || '').toUpperCase().trim(),
  };
  
  console.log('Normalized data:', JSON.stringify(normalized, null, 2));
  return normalized;
}

export function validateRequest(data: Partial<ManualValuationRequest>): ValidationResult {
  console.log('Starting validation for:', JSON.stringify(data, null, 2));
  const errors: string[] = [];

  // Required field checks with detailed logging
  if (!data.make?.trim()) {
    console.log('Make validation failed: empty or missing');
    errors.push('Make is required');
  }
  
  if (!data.model?.trim()) {
    console.log('Model validation failed: empty or missing');
    errors.push('Model is required');
  }
  
  // Year validation with detailed logging
  const currentYear = new Date().getFullYear();
  if (!data.year || isNaN(data.year) || data.year < 1900 || data.year > currentYear + 1) {
    console.log('Year validation failed:', {
      value: data.year,
      isNumber: !isNaN(data.year),
      withinRange: data.year >= 1900 && data.year <= currentYear + 1
    });
    errors.push(`Year must be between 1900 and ${currentYear + 1}`);
  }

  // Mileage validation with detailed logging
  if (!data.mileage || isNaN(data.mileage) || data.mileage < 0) {
    console.log('Mileage validation failed:', {
      value: data.mileage,
      isNumber: !isNaN(data.mileage),
      isPositive: data.mileage >= 0
    });
    errors.push('Mileage must be a positive number');
  }

  // Transmission validation with case-insensitive comparison
  const normalizedTransmission = normalizeString(String(data.transmission));
  if (!data.transmission || !VALID_TRANSMISSION_TYPES.includes(normalizedTransmission as TransmissionType)) {
    console.log('Transmission validation failed:', {
      value: data.transmission,
      normalized: normalizedTransmission,
      validOptions: VALID_TRANSMISSION_TYPES
    });
    errors.push(`Invalid transmission type. Must be one of: ${VALID_TRANSMISSION_TYPES.join(', ')}`);
  }

  // Fuel type validation with case-insensitive comparison
  const normalizedFuel = normalizeString(String(data.fuel));
  if (!data.fuel || !VALID_FUEL_TYPES.includes(normalizedFuel as FuelType)) {
    console.log('Fuel type validation failed:', {
      value: data.fuel,
      normalized: normalizedFuel,
      validOptions: VALID_FUEL_TYPES,
      isValid: VALID_FUEL_TYPES.includes(normalizedFuel as FuelType)
    });
    errors.push(`Invalid fuel type. Must be one of: ${VALID_FUEL_TYPES.join(', ')}`);
  }

  // Country code validation with case-insensitive comparison
  const normalizedCountry = String(data.country).toUpperCase().trim();
  if (!data.country || !VALID_COUNTRY_CODES.includes(normalizedCountry as CountryCode)) {
    console.log('Country code validation failed:', {
      value: data.country,
      normalized: normalizedCountry,
      validOptions: VALID_COUNTRY_CODES,
      isValid: VALID_COUNTRY_CODES.includes(normalizedCountry as CountryCode)
    });
    errors.push(`Invalid country code. Must be one of: ${VALID_COUNTRY_CODES.join(', ')}`);
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  console.log('Validation result:', JSON.stringify(result, null, 2));
  return result;
}