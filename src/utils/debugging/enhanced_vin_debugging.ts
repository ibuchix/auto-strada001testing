
/**
 * Enhanced debugging utilities for VIN validation and valuation
 * Created: 2025-04-30 - Added deep validation response inspection
 */

/**
 * Deeply scan an object for price-related fields
 */
export function deepScanForPrices(data: any, path: string = '', result: Record<string, any> = {}): Record<string, any> {
  if (!data || typeof data !== 'object') return result;
  
  // Direct price-related fields to check
  const priceFields = ['price', 'price_med', 'price_min', 'price_max', 'price_avr', 
                     'valuation', 'basePrice', 'averagePrice', 'reservePrice', 'value'];
                     
  // Check current object for price fields
  Object.entries(data).forEach(([key, value]) => {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (priceFields.includes(key) && (typeof value === 'number' || !isNaN(Number(value)))) {
      result[currentPath] = value;
    }
    
    // Recursively check nested objects, but not arrays to avoid circular references
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      deepScanForPrices(value, currentPath, result);
    }
  });
  
  return result;
}

/**
 * Debug the API response for VIN validation
 */
export function debugVinApiResponse(event: string, data: any): void {
  console.group(`🔍 VIN API Response Debug [${event}]`);
  
  try {
    console.log('Response received:', !!data);
    
    if (!data) {
      console.warn('Empty response data');
      console.groupEnd();
      return;
    }
    
    // Basic data check
    console.log('Basic data structure:', {
      hasModel: !!data.model,
      hasMake: !!data.make,
      hasYear: !!data.year,
      hasMileage: !!data.mileage,
      hasVin: !!data.vin,
      hasTransmission: !!data.transmission,
      hasError: !!data.error
    });
    
    // Price data check
    console.log('Pricing data:', {
      hasBasePrice: typeof data.basePrice === 'number' && data.basePrice > 0,
      hasValuation: typeof data.valuation === 'number' && data.valuation > 0,
      hasReservePrice: typeof data.reservePrice === 'number' && data.reservePrice > 0,
      hasAveragePrice: typeof data.averagePrice === 'number' && data.averagePrice > 0
    });
    
    // Extract all price-related fields from the response
    const priceFields = deepScanForPrices(data);
    
    if (Object.keys(priceFields).length > 0) {
      console.log('💰 All price fields found:', priceFields);
    } else {
      console.warn('⚠️ No price fields found in the response');
    }
    
    // Show raw API response if available (for deep debugging)
    if (data.rawApiResponse) {
      try {
        const parsedRaw = typeof data.rawApiResponse === 'string' 
          ? JSON.parse(data.rawApiResponse) 
          : data.rawApiResponse;
        console.log('Raw API structure keys:', Object.keys(parsedRaw));
      } catch (e) {
        console.log('Could not parse raw API response');
      }
    }
    
  } catch (error) {
    console.error('Error during API response debug:', error);
  }
  
  console.groupEnd();
}
