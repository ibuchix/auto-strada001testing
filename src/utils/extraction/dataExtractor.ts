
/**
 * Vehicle data extraction utility
 * Updated: 2025-05-05 - Rewritten for direct nested data access
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
  console.log('[DATA-EXTRACTOR] Processing raw response:', typeof rawResponse);
  
  // Parse if string
  let data;
  if (typeof rawResponse === 'string') {
    try {
      data = JSON.parse(rawResponse);
      console.log('[DATA-EXTRACTOR] Successfully parsed string response');
    } catch (e) {
      console.error('[DATA-EXTRACTOR] Failed to parse string response:', e);
      return null;
    }
  } else {
    data = rawResponse;
  }
  
  // Log the structure we're working with
  console.log('[DATA-EXTRACTOR] Response structure:', {
    hasUserParams: !!data?.functionResponse?.userParams,
    userParamsKeys: data?.functionResponse?.userParams ? Object.keys(data.functionResponse.userParams) : []
  });

  // Direct access to userParams
  const userParams = data?.functionResponse?.userParams;
  if (!userParams) {
    console.error('[DATA-EXTRACTOR] Missing userParams in response');
    return null;
  }

  // Extract vehicle details with explicit type checking
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
    return null;
  }

  console.log('[DATA-EXTRACTOR] Successfully extracted vehicle data:', vehicleData);
  return vehicleData;
}

/**
 * Extract price data directly from the calcValuation structure
 */
export function extractPriceData(rawResponse: any): PriceData | null {
  console.log('[PRICE-EXTRACTOR] Processing raw response:', typeof rawResponse);
  
  // Parse if string
  let data;
  if (typeof rawResponse === 'string') {
    try {
      data = JSON.parse(rawResponse);
      console.log('[PRICE-EXTRACTOR] Successfully parsed string response');
    } catch (e) {
      console.error('[PRICE-EXTRACTOR] Failed to parse string response:', e);
      return null;
    }
  } else {
    data = rawResponse;
  }
  
  // Log the structure we're working with
  console.log('[PRICE-EXTRACTOR] Response structure:', {
    hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation,
    calcValuationKeys: data?.functionResponse?.valuation?.calcValuation ? 
      Object.keys(data.functionResponse.valuation.calcValuation) : []
  });

  // Direct access to calcValuation
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  if (!calcValuation) {
    console.error('[PRICE-EXTRACTOR] Missing calcValuation in response');
    return null;
  }

  // Extract price data with explicit type conversion
  const priceData: PriceData = {
    price: parseInt(calcValuation.price, 10) || 0,
    price_min: parseInt(calcValuation.price_min, 10) || 0,
    price_max: parseInt(calcValuation.price_max, 10) || 0,
    price_avr: parseInt(calcValuation.price_avr, 10) || 0,
    price_med: parseInt(calcValuation.price_med, 10) || 0
  };

  // Validate essential fields
  if (!priceData.price_min || !priceData.price_med) {
    console.error('[PRICE-EXTRACTOR] Missing essential price data:', priceData);
    return null;
  }

  console.log('[PRICE-EXTRACTOR] Successfully extracted price data:', priceData);
  return priceData;
}

