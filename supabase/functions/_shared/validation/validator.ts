
/**
 * Core validation functionality
 * Created: 2025-04-19
 */
import { ValuationData, ValidationResult } from './types';
import { logOperation } from '../logging';

export function validateVehicleData(
  data: Partial<ValuationData>,
  requestId: string
): ValidationResult {
  const errors: string[] = [];
  
  // Required fields check
  if (!data.make) errors.push("Missing vehicle make");
  if (!data.model) errors.push("Missing vehicle model");
  if (!data.year || data.year < 1900 || data.year > new Date().getFullYear() + 1) {
    errors.push("Invalid vehicle year");
  }
  if (!data.vin || data.vin.length < 11 || data.vin.length > 17) {
    errors.push("Invalid VIN format");
  }
  if (data.mileage === undefined || data.mileage < 0) {
    errors.push("Invalid mileage value");
  }
  
  // Validate transmission type
  if (data.transmission && !["manual", "automatic"].includes(data.transmission)) {
    errors.push("Invalid transmission type");
  }
  
  // Validate price fields
  if (data.valuation !== undefined && (isNaN(data.valuation) || data.valuation < 0)) {
    errors.push("Invalid valuation amount");
  }
  if (data.reservePrice !== undefined && (isNaN(data.reservePrice) || data.reservePrice < 0)) {
    errors.push("Invalid reserve price");
  }
  
  const isValid = errors.length === 0;
  
  logOperation("vehicle_data_validation", {
    requestId,
    isValid,
    errors,
    fieldsPresent: Object.keys(data)
  });
  
  return { isValid, errors };
}
