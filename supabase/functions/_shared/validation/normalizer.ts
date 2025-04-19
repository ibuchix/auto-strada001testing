
/**
 * Data normalization utilities
 * Created: 2025-04-19
 */

/**
 * Normalize VIN by removing spaces and converting to uppercase
 * @param vin The VIN to normalize
 * @returns Normalized VIN
 */
export function normalizeVin(vin: string): string {
  return vin.replace(/\s+/g, '').toUpperCase();
}

/**
 * Normalize a numerical value
 * @param value The value to normalize
 * @param defaultValue Default value if normalization fails
 * @returns Normalized number
 */
export function normalizeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  
  // If already a number, return it
  if (typeof value === 'number' && !isNaN(value)) return value;
  
  // Try to convert to number
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Normalize a boolean value
 * @param value The value to normalize
 * @param defaultValue Default value if normalization fails
 * @returns Normalized boolean
 */
export function normalizeBoolean(value: any, defaultValue: boolean = false): boolean {
  if (value === null || value === undefined) return defaultValue;
  
  // If already a boolean, return it
  if (typeof value === 'boolean') return value;
  
  // Handle string values
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase();
    if (lowercased === 'true' || lowercased === 'yes' || lowercased === '1') return true;
    if (lowercased === 'false' || lowercased === 'no' || lowercased === '0') return false;
  }
  
  // Handle number values
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return defaultValue;
}

/**
 * Normalize a string value
 * @param value The value to normalize
 * @param defaultValue Default value if normalization fails
 * @returns Normalized string
 */
export function normalizeString(value: any, defaultValue: string = ''): string {
  if (value === null || value === undefined) return defaultValue;
  
  // If already a string, return it trimmed
  if (typeof value === 'string') return value.trim();
  
  // Convert to string
  return String(value);
}
