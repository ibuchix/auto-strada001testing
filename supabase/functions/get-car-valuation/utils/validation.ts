import { ValuationRequest } from '../types.ts';

export function validateVin(vin: string): { isValid: boolean; error?: string } {
  if (!vin || typeof vin !== 'string') {
    return { isValid: false, error: 'VIN must be a string' };
  }

  // Basic VIN validation (17 alphanumeric characters)
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return { isValid: false, error: 'Invalid VIN format' };
  }

  return { isValid: true };
}

export function validateMileage(mileage: number): { isValid: boolean; error?: string } {
  if (typeof mileage !== 'number') {
    return { isValid: false, error: 'Mileage must be a number' };
  }

  if (mileage < 0 || mileage > 1000000) {
    return { isValid: false, error: 'Mileage must be between 0 and 1,000,000' };
  }

  return { isValid: true };
}

export function validateRequest(data: any): { isValid: boolean; error?: string } {
  if (!data) {
    return { isValid: false, error: 'Request data is required' };
  }

  const vinValidation = validateVin(data.vin);
  if (!vinValidation.isValid) {
    return vinValidation;
  }

  const mileageValidation = validateMileage(data.mileage);
  if (!mileageValidation.isValid) {
    return mileageValidation;
  }

  if (data.gearbox && !['manual', 'automatic'].includes(data.gearbox)) {
    return { isValid: false, error: 'Invalid gearbox type' };
  }

  return { isValid: true };
}