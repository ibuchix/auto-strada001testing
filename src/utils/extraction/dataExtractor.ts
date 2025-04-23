
/**
 * Data extraction utilities for safely handling nested API responses
 * Updated: 2025-05-02 - Enhanced extraction utilities with better type safety
 * Updated: 2025-05-02 - Removed fallback estimation logic as requested
 */

/**
 * Safely extract a value from a nested object using an array of possible paths
 * Returns the first valid value found or the default value
 * 
 * @param obj The object to extract from
 * @param paths Array of possible property paths to try
 * @param defaultValue Default value to return if no valid value is found
 * @param typeValidator Optional function to validate the value type
 */
export function extractValue<T>(
  obj: any,
  paths: string[],
  defaultValue: T,
  typeValidator?: (value: any) => boolean
): T {
  if (!obj || typeof obj !== 'object') {
    return defaultValue;
  }

  // Try each path in order
  for (const path of paths) {
    const value = getNestedProperty(obj, path);
    
    // If we found a value and it passes validation (if provided)
    if (value !== undefined && value !== null && 
        (!typeValidator || typeValidator(value))) {
      
      // Convert string to number if default is a number and value is numeric string
      if (typeof defaultValue === 'number' && typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value) as unknown as T;
      }
      
      return value as T;
    }
  }
  
  return defaultValue;
}

/**
 * Get a nested property from an object using a dot-notation path
 * 
 * @param obj The object to extract from
 * @param path Property path using dot notation (e.g., 'user.address.city')
 * @returns The value at the path or undefined if not found
 */
function getNestedProperty(obj: any, path: string): any {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

/**
 * Validate if an object has all required properties with valid values
 * 
 * @param obj Object to validate
 * @param requiredProps Array of required property names
 * @returns True if all required properties exist and have values
 */
export function hasRequiredProperties(obj: any, requiredProps: string[]): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredProps.every(prop => {
    const value = obj[prop];
    
    // Check if value exists and is not empty
    if (value === undefined || value === null) return false;
    
    // For strings, check if empty
    if (typeof value === 'string' && value.trim() === '') return false;
    
    // For numbers, check if valid number
    if (typeof value === 'number' && (isNaN(value) || value <= 0)) return false;
    
    return true;
  });
}

/**
 * Type validators for common data types
 */
export const validators = {
  isNumber: (value: any): boolean => 
    (typeof value === 'number' && !isNaN(value)) || 
    (typeof value === 'string' && !isNaN(Number(value))),
  
  isPositiveNumber: (value: any): boolean => {
    const num = typeof value === 'number' ? value : Number(value);
    return !isNaN(num) && num > 0;
  },
  
  isString: (value: any): boolean => 
    typeof value === 'string' && value.trim() !== '',
  
  isYear: (value: any): boolean => {
    const year = Number(value);
    const currentYear = new Date().getFullYear();
    return !isNaN(year) && year > 1900 && year <= currentYear + 1;
  }
};
