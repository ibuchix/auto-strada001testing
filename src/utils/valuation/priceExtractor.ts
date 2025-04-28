
/**
 * Utility for extracting price information from complex nested API responses
 * Created: 2025-04-30 - Added to help with valuation API debugging
 */

/**
 * Deep scan an object structure for any price-related fields
 * @param obj The object to scan
 * @param maxDepth Maximum depth to scan (default: 6)
 * @returns Object containing all found price fields
 */
export function deepScanForPrices(
  obj: any, 
  maxDepth: number = 6
): Record<string, number> {
  const result: Record<string, number> = {};
  
  // Price-related field names to look for
  const priceFieldPatterns = [
    /price/i, 
    /valuation/i, 
    /value/i, 
    /cost/i,
    /worth/i,
    /amount/i,
    /reserve/i,
    /estimation/i
  ];
  
  // Helper function to recursively scan the object
  function scan(current: any, path: string = '', depth: number = 0) {
    // Stop conditions
    if (
      current === null || 
      current === undefined ||
      depth > maxDepth ||
      typeof current !== 'object'
    ) {
      return;
    }
    
    // Check each property in the current object
    Object.entries(current).forEach(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      
      // If the value is a number or can be parsed as a number
      if (
        (typeof value === 'number' || 
        (typeof value === 'string' && !isNaN(parseFloat(value)))) && 
        value > 0
      ) {
        // Check if the key name is related to pricing
        const isPriceField = priceFieldPatterns.some(pattern => pattern.test(key));
        
        if (isPriceField) {
          const numValue = typeof value === 'number' ? value : parseFloat(value);
          result[currentPath] = numValue;
        }
      }
      
      // Recursively process nested objects, but avoid arrays to prevent issues with large datasets
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        scan(value, currentPath, depth + 1);
      }
    });
  }
  
  scan(obj);
  return result;
}
