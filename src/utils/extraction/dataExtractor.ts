
/**
 * Vehicle data extraction utility
 * Updated: 2025-05-06 - Added detailed extraction debugging logs
 */

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  capacity?: string;
  fuel?: string;
  mileage: number;
}

export interface PriceData {
  price: number;
  price_min: number;
  price_max: number;
  price_avr: number;
  price_med: number;
}

/**
 * Extract vehicle data directly from the API response structure
 */
export function extractVehicleData(rawResponse: any): VehicleData | null {
  const requestId = Math.random().toString(36).substring(2, 10);
  console.group(`[DATA-EXTRACTOR][${requestId}] Extracting vehicle data`);
  console.log('[DATA-EXTRACTOR] Processing raw response:', typeof rawResponse);
  
  // Parse if string
  let data;
  if (typeof rawResponse === 'string') {
    try {
      console.log('[DATA-EXTRACTOR] Attempting to parse string response, first 100 chars:', rawResponse.substring(0, 100));
      data = JSON.parse(rawResponse);
      console.log('[DATA-EXTRACTOR] Successfully parsed string response');
    } catch (e) {
      console.error('[DATA-EXTRACTOR] Failed to parse string response:', e);
      console.groupEnd();
      return null;
    }
  } else {
    data = rawResponse;
  }
  
  // Log the structure we're working with
  console.log('[DATA-EXTRACTOR] Response structure:', {
    hasUserParams: !!data?.functionResponse?.userParams,
    userParamsKeys: data?.functionResponse?.userParams ? Object.keys(data.functionResponse.userParams) : [],
    topLevelKeys: Object.keys(data || {})
  });

  // Direct access to userParams
  const userParams = data?.functionResponse?.userParams;
  if (!userParams) {
    console.error('[DATA-EXTRACTOR] Missing userParams in response');
    
    // Log alternatives for debugging
    console.log('[DATA-EXTRACTOR] Looking for alternatives:', {
      hasTopLevelMake: !!data?.make,
      hasTopLevelModel: !!data?.model,
      hasTopLevelYear: !!data?.year
    });
    
    // Try to extract from top level as fallback
    if (data?.make && data?.model && data?.year) {
      console.log('[DATA-EXTRACTOR] Using top-level data as fallback');
      const vehicleData: VehicleData = {
        make: String(data.make || ''),
        model: String(data.model || ''),
        year: parseInt(data.year, 10) || 0,
        capacity: data.capacity,
        fuel: data.fuel,
        mileage: parseInt(data.mileage || data.odometer, 10) || 0
      };
      console.log('[DATA-EXTRACTOR] Extracted fallback vehicle data:', vehicleData);
      console.groupEnd();
      return vehicleData;
    }
    
    console.groupEnd();
    return null;
  }

  // Extract vehicle details with explicit type checking
  console.log('[DATA-EXTRACTOR] Extracting from userParams:', {
    make: userParams.make,
    model: userParams.model,
    year: userParams.year,
    odometer: userParams.odometer
  });
  
  const vehicleData: VehicleData = {
    make: String(userParams.make || ''),
    model: String(userParams.model || ''),
    year: parseInt(userParams.year, 10) || 0,
    capacity: userParams.capacity,
    fuel: userParams.fuel,
    mileage: parseInt(userParams.odometer, 10) || 0
  };

  // Validate essential fields
  if (!vehicleData.make || !vehicleData.model || !vehicleData.year) {
    console.error('[DATA-EXTRACTOR] Missing essential vehicle data:', vehicleData);
    console.groupEnd();
    return null;
  }

  console.log('[DATA-EXTRACTOR] Successfully extracted vehicle data:', vehicleData);
  console.groupEnd();
  return vehicleData;
}

/**
 * Extract price data directly from the calcValuation structure
 */
export function extractPriceData(rawResponse: any): PriceData | null {
  const requestId = Math.random().toString(36).substring(2, 10);
  console.group(`[PRICE-EXTRACTOR][${requestId}] Extracting price data`);
  console.log('[PRICE-EXTRACTOR] Processing raw response:', typeof rawResponse);
  
  // Parse if string
  let data;
  if (typeof rawResponse === 'string') {
    try {
      console.log('[PRICE-EXTRACTOR] Attempting to parse string response, first 100 chars:', rawResponse.substring(0, 100));
      data = JSON.parse(rawResponse);
      console.log('[PRICE-EXTRACTOR] Successfully parsed string response');
    } catch (e) {
      console.error('[PRICE-EXTRACTOR] Failed to parse string response:', e);
      console.groupEnd();
      return null;
    }
  } else {
    data = rawResponse;
  }
  
  // Log the structure we're working with
  console.log('[PRICE-EXTRACTOR] Response structure:', {
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation,
    calcValuationKeys: data?.functionResponse?.valuation?.calcValuation ? 
      Object.keys(data.functionResponse.valuation.calcValuation) : [],
    hasDirectPriceFields: !!(data?.price_min || data?.price_med || data?.price)
  });

  // Track extraction path
  let extractionPath = 'unknown';
  let calcValuation;
  let priceData: PriceData;
  
  // Try multiple paths to find price data
  
  // Path 1: Direct access to calcValuation (preferred path)
  calcValuation = data?.functionResponse?.valuation?.calcValuation;
  if (calcValuation) {
    extractionPath = 'calcValuation';
    console.log('[PRICE-EXTRACTOR] Found calcValuation at standard path:', {
      price_min: calcValuation.price_min,
      price_med: calcValuation.price_med,
      price: calcValuation.price
    });
    
    priceData = {
      price: parseInt(calcValuation.price, 10) || 0,
      price_min: parseInt(calcValuation.price_min, 10) || 0,
      price_max: parseInt(calcValuation.price_max, 10) || 0,
      price_avr: parseInt(calcValuation.price_avr, 10) || 0,
      price_med: parseInt(calcValuation.price_med, 10) || 0
    };
  }
  // Path 2: Direct fields at top level
  else if (data.price_min !== undefined || data.price_med !== undefined) {
    extractionPath = 'topLevel';
    console.log('[PRICE-EXTRACTOR] Found price fields at top level:', {
      price_min: data.price_min,
      price_med: data.price_med,
      price: data.price
    });
    
    priceData = {
      price: parseInt(data.price, 10) || 0,
      price_min: parseInt(data.price_min, 10) || 0,
      price_max: parseInt(data.price_max, 10) || 0,
      price_avr: parseInt(data.price_avr, 10) || 0,
      price_med: parseInt(data.price_med, 10) || 0
    };
  }
  // Path 3: Check rawNestedData
  else if (data?.rawNestedData?.calcValuation) {
    extractionPath = 'rawNestedData';
    console.log('[PRICE-EXTRACTOR] Found calcValuation in rawNestedData:', {
      price_min: data.rawNestedData.calcValuation.price_min,
      price_med: data.rawNestedData.calcValuation.price_med
    });
    
    calcValuation = data.rawNestedData.calcValuation;
    priceData = {
      price: parseInt(calcValuation.price, 10) || 0,
      price_min: parseInt(calcValuation.price_min, 10) || 0,
      price_max: parseInt(calcValuation.price_max, 10) || 0,
      price_avr: parseInt(calcValuation.price_avr, 10) || 0,
      price_med: parseInt(calcValuation.price_med, 10) || 0
    };
  }
  // No price data found
  else {
    console.error('[PRICE-EXTRACTOR] Could not find price data in any expected location');
    
    // Last resort: scan the entire object for any price fields
    console.log('[PRICE-EXTRACTOR] Scanning for any price fields in the response');
    const priceFields = scanForPriceFields(data);
    
    if (Object.keys(priceFields).length > 0) {
      console.log('[PRICE-EXTRACTOR] Found these potential price fields:', priceFields);
    }
    
    console.groupEnd();
    return null;
  }

  // Validate essential price fields
  if (!priceData.price_min || !priceData.price_med) {
    console.error('[PRICE-EXTRACTOR] Missing essential price data:', priceData);
    console.groupEnd();
    return null;
  }

  console.log(`[PRICE-EXTRACTOR] Successfully extracted price data via ${extractionPath}:`, priceData);
  console.groupEnd();
  return priceData;
}

/**
 * Helper function to scan for price-related fields
 */
function scanForPriceFields(data: any, path: string = ''): Record<string, number> {
  const result: Record<string, number> = {};
  
  if (!data || typeof data !== 'object') {
    return result;
  }
  
  for (const key in data) {
    const currentPath = path ? `${path}.${key}` : key;
    
    // Check if this is a price field
    if (typeof data[key] === 'number' && /price|valuation|cost|value/i.test(key)) {
      result[currentPath] = data[key];
    } 
    // Recursively scan nested objects
    else if (data[key] && typeof data[key] === 'object') {
      const nestedResults = scanForPriceFields(data[key], currentPath);
      Object.assign(result, nestedResults);
    }
  }
  
  return result;
}
