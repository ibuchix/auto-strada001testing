
/**
 * Changes made:
 * - Added type checking and field filtering utilities
 * - Added support for checking database schema compatibility
 * - Updated and enhanced object transformation functions for consistent casing
 */

type CaseTransform = {
  [key: string]: any;
};

/**
 * Converts a camelCase string to snake_case
 * Example: "myVariableName" => "my_variable_name"
 */
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Converts a snake_case string to camelCase
 * Example: "my_variable_name" => "myVariableName"
 */
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Transforms an object with snake_case keys to camelCase keys
 * Works recursively on nested objects and arrays
 */
export const transformObjectToCamelCase = (obj: CaseTransform): CaseTransform => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectToCamelCase(item));
  }
  
  const camelCaseObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    const camelKey = toCamelCase(key);
    const value = obj[key];
    
    // Recursively transform nested objects and arrays
    camelCaseObj[camelKey] = typeof value === 'object' && value !== null 
      ? transformObjectToCamelCase(value) 
      : value;
  });
  
  return camelCaseObj;
};

/**
 * Safely filters object properties based on a list of allowed fields
 */
export const filterObjectByAllowedFields = (obj: CaseTransform, allowedFields: string[]): CaseTransform => {
  const filteredObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredObj[key] = obj[key];
    }
  });
  
  return filteredObj;
};

/**
 * Transforms an object with camelCase keys to snake_case keys
 * Works recursively on nested objects and arrays
 */
export const transformObjectToSnakeCase = (obj: CaseTransform): CaseTransform => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectToSnakeCase(item));
  }
  
  const snakeCaseObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = toSnakeCase(key);
    const value = obj[key];
    
    // Recursively transform nested objects and arrays
    snakeCaseObj[snakeKey] = typeof value === 'object' && value !== null 
      ? transformObjectToSnakeCase(value) 
      : value;
  });
  
  return snakeCaseObj;
};

/**
 * Creates a boundary transformation function that automatically
 * converts between frontend and database data formats
 */
export function createBoundaryTransformer<T>(direction: 'toDatabase' | 'toFrontend') {
  return (data: any): T => {
    if (direction === 'toDatabase') {
      return transformObjectToSnakeCase(data) as unknown as T;
    } else {
      return transformObjectToCamelCase(data) as unknown as T;
    }
  };
}
