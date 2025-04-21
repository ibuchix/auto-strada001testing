
/**
 * Utility to deeply scan objects for price-related data
 * Created: 2025-04-29 - Added for enhanced debugging of API responses
 */

interface PriceFieldsResult {
  [key: string]: any;
}

/**
 * Deeply scan an object for any fields that might contain pricing information
 * This helps identify where price data might be hiding in complex nested objects
 */
export function deepScanForPrices(data: any): PriceFieldsResult {
  const result: PriceFieldsResult = {};
  
  if (!data || typeof data !== 'object') {
    return result;
  }
  
  // Helper function to recursively scan the object
  function scan(obj: any, path: string = '') {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    
    // Check all properties at this level
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];
        
        // Check if this is a price-related field based on name
        const isPriceField = /price|valuation|value|cost|reserve|base|average|med|min|max/i.test(key);
        
        // If it's a numeric value and looks like a price field, add it to results
        if (isPriceField && typeof value === 'number' && value > 0) {
          result[currentPath] = value;
        } 
        // If it's an object or array, scan recursively
        else if (typeof value === 'object' && value !== null) {
          scan(value, currentPath);
        }
      }
    }
  }
  
  // Start the scan
  scan(data);
  return result;
}

/**
 * Extract price data from a valuation response with fallbacks
 */
export function extractPriceData(data: any) {
  if (!data) return { valuation: 0, reservePrice: 0, basePrice: 0, averagePrice: 0 };
  
  // Direct price fields
  const prices = {
    valuation: typeof data.valuation === 'number' ? data.valuation : 0,
    reservePrice: typeof data.reservePrice === 'number' ? data.reservePrice : 0,
    basePrice: typeof data.basePrice === 'number' ? data.basePrice : 0,
    averagePrice: typeof data.averagePrice === 'number' ? data.averagePrice : 0,
  };
  
  // Log the extraction
  console.log('%c💰 PRICE EXTRACTION:', 'background: #2196F3; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
  console.table(prices);
  
  // Check if any prices were found
  const hasPrices = prices.valuation > 0 || prices.reservePrice > 0 || 
                   prices.basePrice > 0 || prices.averagePrice > 0;
  
  if (!hasPrices) {
    console.warn('%c⚠️ NO DIRECT PRICES FOUND - USING DEEP SCAN', 'background: #FF9800; color: white; font-size: 12px; padding: 3px 6px; border-radius: 4px');
    
    // Try to find prices with deep scan
    const allPrices = deepScanForPrices(data);
    console.log('Deep scan results:', allPrices);
    
    // Look for specific price fields in the deep scan results
    if (Object.keys(allPrices).length > 0) {
      // Find best candidates for each price type
      for (const path in allPrices) {
        if (path.includes('valuation') && !prices.valuation) {
          prices.valuation = allPrices[path];
        }
        if (path.includes('reserve') && !prices.reservePrice) {
          prices.reservePrice = allPrices[path];
        }
        if ((path.includes('base') || path.includes('price_med')) && !prices.basePrice) {
          prices.basePrice = allPrices[path];
        }
        if ((path.includes('average') || path.includes('price_med')) && !prices.averagePrice) {
          prices.averagePrice = allPrices[path];
        }
      }
    }
  }
  
  return prices;
}
