import { Database } from "@/integrations/supabase/types";
import { ManualValuationRequest, ValidationResult } from '../types/validation.ts';

type FuelType = Database['public']['Enums']['car_fuel_type'];
type CountryCode = Database['public']['Enums']['car_country_code'];
type TransmissionType = Database['public']['Enums']['car_transmission_type'];

const VALID_FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'electric', 'hybrid'];
const VALID_COUNTRY_CODES: CountryCode[] = ['PL', 'DE', 'UK'];
const VALID_TRANSMISSION_TYPES: TransmissionType[] = ['manual', 'automatic'];

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

  // Transmission validation
  if (!data.transmission || !VALID_TRANSMISSION_TYPES.includes(data.transmission as TransmissionType)) {
    errors.push('Invalid transmission type');
    console.log('Available transmission types:', VALID_TRANSMISSION_TYPES);
    console.log('Received transmission:', data.transmission);
  }

  // Fuel type validation
  if (!data.fuel || !VALID_FUEL_TYPES.includes(data.fuel as FuelType)) {
    errors.push('Invalid fuel type');
    console.log('Available fuel types:', VALID_FUEL_TYPES);
    console.log('Received fuel type:', data.fuel);
  }

  // Country code validation
  if (!data.country || !VALID_COUNTRY_CODES.includes(data.country as CountryCode)) {
    errors.push('Invalid country code');
    console.log('Available country codes:', VALID_COUNTRY_CODES);
    console.log('Received country:', data.country);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}