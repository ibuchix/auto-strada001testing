
/**
 * Changes made:
 * - 2024-08-19: Created utility functions for type conversion
 * - These functions help ensure consistent type handling across the application
 */

/**
 * Safely converts a value to a string
 * @param value The value to convert
 * @returns The string representation of the value
 */
export const toStringValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

/**
 * Safely converts a value to a number
 * @param value The value to convert
 * @param defaultValue The default value to return if conversion fails
 * @returns The numeric value or the default value
 */
export const toNumberValue = (
  value: string | number | null | undefined, 
  defaultValue: number = 0
): number => {
  if (value === null || value === undefined) return defaultValue;
  
  const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsedValue) ? defaultValue : parsedValue;
};

/**
 * Safely converts a value to a boolean
 * @param value The value to convert
 * @returns The boolean representation of the value
 */
export const toBooleanValue = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

/**
 * Safely parses a JSON string
 * @param jsonString The JSON string to parse
 * @param fallback The fallback value to return if parsing fails
 * @returns The parsed object or the fallback value
 */
export const safeJsonParse = <T>(jsonString: string | null | undefined, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Error parsing JSON string:', error);
    return fallback;
  }
};
