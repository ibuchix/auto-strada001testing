
/**
 * Shared validation utilities
 * Created: 2025-04-19
 */

/**
 * Validate VIN format
 * @param vin Vehicle Identification Number
 * @returns Boolean indicating valid VIN
 */
export function isValidVin(vin: string): boolean {
  return typeof vin === 'string' 
    && vin.length === 17 
    && /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

/**
 * Validate mileage
 * @param mileage Vehicle mileage
 * @returns Boolean indicating valid mileage
 */
export function isValidMileage(mileage: number): boolean {
  return Number.isInteger(mileage) 
    && mileage >= 0 
    && mileage < 1000000;
}

/**
 * Validate transmission type
 * @param transmission Transmission type
 * @returns Boolean indicating valid transmission
 */
export function isValidTransmission(transmission: any): boolean {
  if (!transmission) return true; // Optional field
  const validTypes = ['manual', 'automatic'];
  return validTypes.includes(String(transmission).toLowerCase());
}
