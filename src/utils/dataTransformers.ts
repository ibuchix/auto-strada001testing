
/**
 * Changes made:
 * - Added type checking and field filtering utilities
 * - Added support for checking database schema compatibility
 */

type CaseTransform = {
  [key: string]: any;
};

export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const transformObjectToCamelCase = (obj: CaseTransform): CaseTransform => {
  const camelCaseObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    const camelKey = toCamelCase(key);
    camelCaseObj[camelKey] = obj[key];
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
 * Converts camelCase object keys to snake_case for database compatibility
 */
export const transformObjectToSnakeCase = (obj: CaseTransform): CaseTransform => {
  const snakeCaseObj: CaseTransform = {};
  
  Object.keys(obj).forEach(key => {
    const snakeKey = toSnakeCase(key);
    snakeCaseObj[snakeKey] = obj[key];
  });
  
  return snakeCaseObj;
};
