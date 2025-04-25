
/**
 * Vehicle data extraction utility
 * Updated: 2025-05-02 - Completely rewritten for reliable nested JSON extraction
 */

/**
 * Extract data from nested paths with specific targeting of the nested structure
 */
export function extractData(
  data: any, 
  paths: string[], 
  defaultValue: any = null
): any {
  if (!data) {
    console.log('No data provided to extractData');
    return defaultValue;
  }
  
  // Log the top-level structure we're working with
  console.log('Extracting data from structure with keys:', Object.keys(data));
  console.log('Looking for paths:', paths);

  for (const path of paths) {
    const pathParts = path.split('.');
    let currentValue = data;
    let validPath = true;

    // Navigate through each part of the path
    for (const part of pathParts) {
      if (currentValue && typeof currentValue === 'object' && part in currentValue) {
        currentValue = currentValue[part];
      } else {
        console.log(`Path ${path} failed at part "${part}"`);
        validPath = false;
        break;
      }
    }

    // If we successfully navigated the entire path, return the value
    if (validPath && currentValue !== null && currentValue !== undefined) {
      console.log(`Found value at path ${path}:`, currentValue);
      return currentValue;
    }
  }

  console.log(`No values found for paths [${paths.join(', ')}], using default:`, defaultValue);
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
