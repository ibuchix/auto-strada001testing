
/**
 * Enhanced debugging utilities for VIN validation and valuation
 * Created: 2025-04-30 - Added deep validation response inspection
 * Updated: 2025-05-01 - Added additional request parameter validation
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
    
    // Check request parameters
    if (data.requestParams) {
      console.log('Request parameters:', data.requestParams);
      
      // Validate VIN format
      if (data.requestParams.vin) {
        const vinLength = String(data.requestParams.vin).length;
        console.log('VIN validation:', {
          length: vinLength,
          isStandardLength: vinLength === 17,
          format: /^[A-HJ-NPR-Z0-9]{8}[0-9X][A-HJ-NPR-Z0-9]{8}$/i.test(data.requestParams.vin) ? 'valid' : 'non-standard'
        });
      }
    }
    
  } catch (error) {
    console.error('Error during API response debug:', error);
  }
  
  console.groupEnd();
}

/**
 * Validates the input parameters before making a valuation request
 */
export function validateValuationParams(vin: string, mileage: number, gearbox: string): { 
  valid: boolean; 
  error?: string;
  cleanedParams?: { vin: string; mileage: number; gearbox: string } 
} {
  // Validate VIN
  if (!vin || typeof vin !== 'string') {
    return { valid: false, error: 'VIN is required' };
  }
  
  const cleanVin = vin.trim().replace(/\s+/g, '');
  if (cleanVin.length < 5) {
    return { valid: false, error: 'VIN must be at least 5 characters' };
  }
  
  if (cleanVin.length > 17) {
    return { valid: false, error: 'VIN cannot exceed 17 characters' };
  }
  
  // Validate mileage
  let cleanMileage: number;
  if (typeof mileage === 'string') {
    const parsedMileage = parseInt(mileage, 10);
    if (isNaN(parsedMileage) || parsedMileage < 0) {
      return { valid: false, error: 'Mileage must be a positive number' };
    }
    cleanMileage = parsedMileage;
  } else if (typeof mileage === 'number') {
    if (isNaN(mileage) || mileage < 0) {
      return { valid: false, error: 'Mileage must be a positive number' };
    }
    cleanMileage = mileage;
  } else {
    return { valid: false, error: 'Invalid mileage format' };
  }
  
  // Validate gearbox
  const cleanGearbox = (gearbox || 'manual').toLowerCase();
  if (cleanGearbox !== 'manual' && cleanGearbox !== 'automatic') {
    return { 
      valid: true, 
      cleanedParams: { 
        vin: cleanVin, 
        mileage: cleanMileage, 
        gearbox: 'manual' // Default to manual if invalid
      }
    };
  }
  
  return { 
    valid: true, 
    cleanedParams: { 
      vin: cleanVin, 
      mileage: cleanMileage, 
      gearbox: cleanGearbox 
    }
  };
}
