/**
 * Changes made:
 * - 2025-04-26: Added support for raw API response structure
 * - 2025-04-30: Enhanced deep scanning for price fields
 */

/**
 * Extract price data from various API response formats
 */
export function extractPriceData(data: any): {
  basePrice: number;
  valuation: number;
  reservePrice: number;
  averagePrice: number;
} | null {
  if (!data) {
    console.error('No data provided to price extractor');
    return null;
  }

  try {
    // Check if we have the raw API response structure
    if (data.rawApiResponse) {
      console.log('Extracting from raw API response');
      
      // Parse the raw response if it's a string
      const rawResponse = typeof data.rawApiResponse === 'string' 
        ? JSON.parse(data.rawApiResponse) 
        : data.rawApiResponse;
      
      // Extract from nested structure
      const valuationData = rawResponse?.functionResponse?.valuation?.calcValuation;
      
      if (valuationData) {
        // Calculate the base price as average of min and median prices
        const basePrice = Math.round((valuationData.price_min + valuationData.price_med) / 2);
        
        return {
          basePrice,
          valuation: valuationData.price || basePrice,
          reservePrice: calculateReservePrice(basePrice),
          averagePrice: valuationData.price_avr || valuationData.price_med
        };
      }
    }
    
    // Fall back to direct fields if available
    if (data.valuation || data.basePrice || data.reservePrice) {
      console.log('Extracting from direct price fields');
      
      const basePrice = data.basePrice || data.valuation || 0;
      
      return {
        basePrice,
        valuation: data.valuation || basePrice,
        reservePrice: data.reservePrice || calculateReservePrice(basePrice),
        averagePrice: data.averagePrice || data.price_med || basePrice
      };
    }
    
    // Last resort: deep scan for any price fields
    const priceFields = deepScanForPrices(data);
    if (Object.keys(priceFields).length > 0) {
      console.log('Extracting from deep scan price fields');
      
      const basePrice = priceFields.basePrice || 
                        priceFields.price_med || 
                        priceFields.price || 
                        0;
      
      return {
        basePrice,
        valuation: priceFields.valuation || priceFields.price || basePrice,
        reservePrice: priceFields.reservePrice || calculateReservePrice(basePrice),
        averagePrice: priceFields.averagePrice || priceFields.price_avr || basePrice
      };
    }
    
    console.error('No price data found in response');
    return null;
  } catch (error) {
    console.error('Error extracting price data:', error);
    return null;
  }
}

/**
 * Calculate reserve price based on base price
 */
function calculateReservePrice(basePrice: number): number {
  if (!basePrice || basePrice <= 0) return 0;
  
  // Determine the percentage based on price tier
  let percentage = 0;
  
  if (basePrice <= 15000) {
    percentage = 0.65;
  } else if (basePrice <= 20000) {
    percentage = 0.46;
  } else if (basePrice <= 30000) {
    percentage = 0.37;
  } else if (basePrice <= 50000) {
    percentage = 0.27;
  } else if (basePrice <= 60000) {
    percentage = 0.27;
  } else if (basePrice <= 70000) {
    percentage = 0.22;
  } else if (basePrice <= 80000) {
    percentage = 0.23;
  } else if (basePrice <= 100000) {
    percentage = 0.24;
  } else if (basePrice <= 130000) {
    percentage = 0.20;
  } else if (basePrice <= 160000) {
    percentage = 0.185;
  } else if (basePrice <= 200000) {
    percentage = 0.22;
  } else if (basePrice <= 250000) {
    percentage = 0.17;
  } else if (basePrice <= 300000) {
    percentage = 0.18;
  } else if (basePrice <= 400000) {
    percentage = 0.18;
  } else if (basePrice <= 500000) {
    percentage = 0.16;
  } else {
    percentage = 0.145; // 500,001+
  }
  
  // Calculate and round to the nearest whole number
  return Math.round(basePrice - (basePrice * percentage));
}

/**
 * Deep scan an object for any price-related fields
 */
export function deepScanForPrices(obj: any, prefix = '', result: Record<string, number> = {}): Record<string, number> {
  if (!obj || typeof obj !== 'object') {
    return result;
  }
  
  // Price-related field names to look for
  const priceFieldNames = [
    'price', 'valuation', 'basePrice', 'reservePrice', 'averagePrice',
    'price_min', 'price_med', 'price_avr', 'price_max'
  ];
  
  for (const key in obj) {
    const value = obj[key];
    const fullPath = prefix ? `${prefix}.${key}` : key;
    
    // If it's a number and the key contains a price-related term
    if (typeof value === 'number' && 
        (priceFieldNames.includes(key) || key.toLowerCase().includes('price'))) {
      result[key] = value;
    }
    
    // Recursively scan nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      deepScanForPrices(value, fullPath, result);
    }
  }
  
  return result;
}
