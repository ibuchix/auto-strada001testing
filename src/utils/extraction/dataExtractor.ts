
/**
 * Data extraction utilities
 * Created: 2025-04-19
 * Modified: 2025-04-23 - Removed duplicate price extraction logic
 * Modified: 2025-04-23 - Now uses dedicated pricePathExtractor utility
 */

import { extractNestedPriceData, calculateBasePriceFromNested } from './pricePathExtractor';
import { validators } from './validators';

/**
 * Extract value from nested object
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

  // Log extraction attempt for debugging
  console.log(`Extracting data for paths: [${paths.join(', ')}]`, {
    availableTopLevelKeys: Object.keys(obj),
    hasFunctionResponse: !!obj.functionResponse,
    hasValuation: obj.functionResponse?.valuation ? true : false
  });

  // Try each path in order
  for (const path of paths) {
    const value = getNestedProperty(obj, path);
    
    if (value !== undefined && value !== null) {
      console.log(`Found value at path ${path}:`, value);
      
      // If we found a value and it passes validation (if provided)
      if (!typeValidator || typeValidator(value)) {
        // Convert string to number if default is a number and value is numeric string
        if (typeof defaultValue === 'number' && typeof value === 'string' && !isNaN(Number(value))) {
          return Number(value) as unknown as T;
        }
        
        return value as T;
      } else {
        console.warn(`Value at path ${path} failed validation:`, value);
      }
    }
  }
  
  // If we got here, no valid value was found
  console.warn(`No valid value found for paths: [${paths.join(', ')}]`);
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
  
  // Traverse the object following the path
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = current[key];
  }
  
  return current;
}

// Export validators for reuse
export { validators };

// Re-export price extraction utilities for backward compatibility
export { 
  extractNestedPriceData, 
  calculateBasePriceFromNested 
} from './pricePathExtractor';
