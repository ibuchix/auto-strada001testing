
/**
 * Data extraction utilities
 * Created: 2025-04-19
 * Modified: 2025-04-23 - Removed duplicate price extraction logic
 * Modified: 2025-04-23 - Now uses dedicated pricePathExtractor utility
 * Modified: 2025-04-24 - Enhanced nested property traversal with better debugging
 */

import { extractNestedPriceData, calculateBasePriceFromNested } from './pricePathExtractor';
import { validators } from './validators';

/**
 * Extract value from nested object with improved path traversal
 */
export function extractValue<T>(
  obj: any,
  paths: string[],
  defaultValue: T,
  typeValidator?: (value: any) => boolean
): T {
  if (!obj || typeof obj !== 'object') {
    console.warn(`Extract value failed: obj is not an object`, { 
      isNull: obj === null,
      type: typeof obj
    });
    return defaultValue;
  }

  // Log extraction attempt with better context
  console.log(`Extracting data for paths: [${paths.join(', ')}]`, {
    availableTopLevelKeys: Object.keys(obj),
    hasFunctionResponse: !!obj.functionResponse,
    hasData: !!obj.data,
    hasNestedFunctionResponse: !!obj?.data?.functionResponse
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
    } else {
      console.log(`No value found at path ${path}, trying next option`);
    }
  }
  
  // If we got here, no valid value was found
  console.warn(`No valid value found for paths: [${paths.join(', ')}]`);
  
  // If obj has a data property, try to extract from there too
  if (obj.data && typeof obj.data === 'object') {
    console.log(`Trying to extract from obj.data property`);
    return extractValue(obj.data, paths, defaultValue, typeValidator);
  }
  
  return defaultValue;
}

/**
 * Get a nested property from an object using a dot-notation path
 * Enhanced with more robust traversal capabilities
 */
function getNestedProperty(obj: any, path: string): any {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  
  // Handle empty path
  if (!path) return undefined;
  
  const keys = path.split('.');
  let current = obj;
  
  // Traverse the object following the path with better error handling
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    
    // Move to the next level
    current = current[key];
    
    // Break early if we hit undefined
    if (current === undefined) {
      return undefined;
    }
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
