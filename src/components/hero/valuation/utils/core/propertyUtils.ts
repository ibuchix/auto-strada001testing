
/**
 * Utility functions for handling nested properties
 * Created: 2025-04-19 - Split from valuationDataNormalizer.ts
 */

/**
 * Find a property in a nested object structure with depth limiting
 */
export function findNestedProperty(
  obj: any, 
  propertyName: string, 
  maxDepth = 3, 
  currentDepth = 0
): any {
  if (currentDepth > maxDepth || !obj || typeof obj !== 'object') {
    return undefined;
  }
  
  if (obj[propertyName] !== undefined) {
    return obj[propertyName];
  }
  
  for (const key in obj) {
    if (obj[key] === null || typeof obj[key] !== 'object') continue;
    if (typeof obj[key] === 'function' || (obj[key] instanceof Element)) continue;
    
    try {
      const result = findNestedProperty(
        obj[key], 
        propertyName, 
        maxDepth, 
        currentDepth + 1
      );
      if (result !== undefined) {
        return result;
      }
    } catch (e) {
      continue;
    }
  }
  
  return undefined;
}
