
/**
 * Validation utilities for get-vehicle-valuation
 * Created: 2025-04-28 - Added comprehensive input validation
 */

import { ValuationError } from './error-handling.ts';
import { logOperation } from './logging.ts';

/**
 * Validate VIN format
 * @param vin Vehicle identification number to validate
 * @returns boolean indicating if the VIN is valid
 */
export function isValidVin(vin: string): boolean {
  if (!vin || typeof vin !== 'string') {
    return false;
  }
  
  const cleanVin = vin.trim().toUpperCase();
  return cleanVin.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(cleanVin);
}

/**
 * Validate mileage value
 * @param mileage Vehicle mileage to validate
 * @returns boolean indicating if the mileage is valid
 */
export function isValidMileage(mileage: number): boolean {
  return typeof mileage === 'number' && 
         !isNaN(mileage) && 
         mileage >= 0 && 
         mileage <= 1000000;
}

/**
 * Validate request parameters
 * @param data Request data to validate
 * @param requestId Request identifier for logging
 */
export function validateRequest(data: any, requestId: string): void {
  if (!data) {
    throw new ValuationError('Request body is required', 'MISSING_BODY');
  }

  logOperation('validating_request', {
    requestId,
    hasVin: !!data.vin,
    hasMileage: data.mileage !== undefined,
    vinLength: data.vin?.length
  });

  if (!data.vin) {
    throw new ValuationError(
      'VIN is required',
      'MISSING_VIN',
      [{ field: 'vin', message: 'VIN must be provided' }]
    );
  }

  if (!isValidVin(data.vin)) {
    throw new ValuationError(
      'Invalid VIN format',
      'INVALID_VIN',
      [{
        field: 'vin',
        message: 'VIN must be 17 characters and contain only valid characters',
        value: data.vin
      }]
    );
  }

  if (data.mileage === undefined || data.mileage === null) {
    throw new ValuationError(
      'Mileage is required',
      'MISSING_MILEAGE',
      [{ field: 'mileage', message: 'Mileage must be provided' }]
    );
  }

  if (!isValidMileage(Number(data.mileage))) {
    throw new ValuationError(
      'Invalid mileage value',
      'INVALID_MILEAGE',
      [{
        field: 'mileage',
        message: 'Mileage must be a positive number under 1,000,000',
        value: data.mileage
      }]
    );
  }
}
