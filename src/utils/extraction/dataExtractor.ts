
/**
 * Vehicle data extraction utility
 * Updated: 2025-04-25 - Completely rewritten to extract from nested JSON
 */

export function extractData(
  data: any, 
  paths: string[], 
  defaultValue: any = null
): any {
  if (!data) return defaultValue;

  for (const path of paths) {
    const pathParts = path.split('.');
    let currentValue = data;

    for (const part of pathParts) {
      if (currentValue && typeof currentValue === 'object' && part in currentValue) {
        currentValue = currentValue[part];
      } else {
        currentValue = null;
        break;
      }
    }

    if (currentValue !== null && currentValue !== undefined) {
      return currentValue;
    }
  }

  return defaultValue;
}

export const validators = {
  isString: (value: any) => typeof value === 'string',
  isNumber: (value: any) => typeof value === 'number' && !isNaN(value),
  isYear: (value: any) => {
    const year = Number(value);
    return !isNaN(year) && year > 1900 && year <= new Date().getFullYear();
  }
};
