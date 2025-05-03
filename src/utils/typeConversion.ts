
/**
 * Type conversion utilities
 * Created: 2025-07-22
 */

/**
 * Converts a value to a string safely
 * @param value The value to convert
 * @returns The string representation of the value
 */
export const toStringValue = (value: any): string => {
  if (typeof value === 'undefined' || value === null) {
    return '';
  }
  return String(value);
};

/**
 * Converts a value to a number safely
 * @param value The value to convert
 * @param defaultValue The default value to return if conversion fails
 * @returns The numeric value or default
 */
export const toNumberValue = (value: any, defaultValue: number = 0): number => {
  if (typeof value === 'undefined' || value === null) {
    return defaultValue;
  }
  
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Converts a value to a boolean safely
 * @param value The value to convert
 * @returns The boolean representation of the value
 */
export const toBooleanValue = (value: any): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  
  return Boolean(value);
};
