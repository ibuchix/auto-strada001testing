import { ManualValuationRequest } from "../types/validation.ts";

export const normalizeData = (data: any): ManualValuationRequest => {
  console.log('Normalizing data:', data);
  const normalized = {
    make: String(data.make || '').trim(),
    model: String(data.model || '').trim(),
    year: parseInt(data.year) || 0,
    mileage: parseInt(data.mileage) || 0,
    transmission: String(data.transmission || '').toLowerCase(),
    fuel: String(data.fuel || '').toLowerCase(),
    country: String(data.country || '').toUpperCase(),
    capacity: data.capacity ? parseInt(data.capacity) : undefined
  };
  console.log('Normalized data:', normalized);
  return normalized;
};

export const validateRequest = (data: ManualValuationRequest) => {
  console.log('Validating request data:', data);
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();

  if (!data.make) errors.push('Make is required');
  if (!data.model) errors.push('Model is required');
  if (!data.year || data.year < 1900 || data.year > currentYear + 1) {
    errors.push(`Year must be between 1900 and ${currentYear + 1}`);
  }
  if (!data.mileage || data.mileage < 0) errors.push('Valid mileage is required');
  if (!data.transmission) errors.push('Transmission is required');
  if (!data.fuel) errors.push('Fuel type is required');
  if (!data.country) errors.push('Country is required');
  if (data.capacity !== undefined && (data.capacity < 0 || data.capacity > 10000)) {
    errors.push('Capacity must be between 0 and 10,000 cc');
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };
  console.log('Validation result:', result);
  return result;
};