import { ManualValuationRequest } from "../types/validation.ts";

export const normalizeData = (data: any): ManualValuationRequest => {
  return {
    make: String(data.make || ''),
    model: String(data.model || ''),
    year: parseInt(data.year) || 0,
    mileage: parseInt(data.mileage) || 0,
    transmission: String(data.transmission || ''),
    fuel: String(data.fuel || ''),
    country: String(data.country || ''),
    capacity: data.capacity ? parseInt(data.capacity) : undefined
  };
};

export const validateRequest = (data: ManualValuationRequest) => {
  const errors: string[] = [];
  const currentYear = new Date().getFullYear();

  if (!data.make) errors.push('Make is required');
  if (!data.model) errors.push('Model is required');
  if (!data.year || data.year < 1900 || data.year > currentYear + 1) {
    errors.push(`Year must be between 1900 and ${currentYear + 1}`);
  }
  if (!data.mileage || data.mileage < 0) errors.push('Valid mileage is required');
  if (!data.transmission) errors.push('Transmission is required');
  if (data.capacity !== undefined && (data.capacity < 0 || data.capacity > 10000)) {
    errors.push('Capacity must be between 0 and 10,000 cc');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};