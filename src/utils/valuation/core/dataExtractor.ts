/**
 * Vehicle data extraction utility
 * Created: 2025-05-01
 * Updated: 2025-05-07 - Improved direct data extraction from nested API structure
 * Updated: 2025-05-08 - Added extraction of VIN and mileage from all potential locations
 * 
 * This utility safely extracts vehicle data from the API response.
 */

/**
 * Extract necessary vehicle data fields from the API response
 */
export function extractVehicleData(data: any) {
  if (!data) {
    console.warn('extractVehicleData: No data provided');
    return null;
  }

  console.group('Vehicle Data Extraction');
  console.log('Extracting from data structure:', {
    dataType: typeof data,
    topLevelKeys: data ? Object.keys(data) : []
  });

  // Direct access method - if we have the fields at the top level
  if (data.make && data.model) {
    console.log('Found data at top level');
    const result = {
      make: data.make,
      model: data.model,
      year: data.year || 0,
      transmission: data.transmission || 'manual',
      // Include VIN and mileage from top level if available
      vin: data.vin || '',
      mileage: data.mileage || data.odometer || 0
    };
    console.log('Extracted vehicle data:', result);
    console.groupEnd();
    return result;
  }

  // Check for nested data in functionResponse
  if (data.functionResponse?.userParams) {
    console.log('Found data in functionResponse.userParams');
    const userParams = data.functionResponse.userParams;
    const result = {
      make: userParams.make || '',
      model: userParams.model || '',
      year: userParams.year || 0,
      transmission: userParams.gearbox || data.transmission || 'manual',
      // Extract VIN and mileage/odometer from functionResponse
      vin: userParams.vin || data.vin || '',
      mileage: userParams.odometer || userParams.mileage || data.mileage || 0
    };
    console.log('Extracted vehicle data from functionResponse:', result);
    console.groupEnd();
    return result;
  }

  // Check for nested data in rawNestedData
  if (data.rawNestedData) {
    console.log('Found data in rawNestedData');
    const result = {
      make: data.rawNestedData.make || '',
      model: data.rawNestedData.model || '',
      year: data.rawNestedData.year || 0,
      transmission: data.transmission || 'manual',
      // Extract VIN and mileage from rawNestedData
      vin: data.rawNestedData.vin || data.vin || '',
      mileage: data.rawNestedData.mileage || data.rawNestedData.odometer || data.mileage || 0
    };
    console.log('Extracted vehicle data from rawNestedData:', result);
    console.groupEnd();
    return result;
  }

  // If we couldn't find structured data, look for VIN and mileage directly
  const fallbackResult = {
    make: '',
    model: '',
    year: 0,
    transmission: 'manual',
    vin: data.vin || '',
    mileage: extractMileageFromAnySource(data)
  };

  console.warn('Could not find complete vehicle data in response, using fallback values:', fallbackResult);
  console.groupEnd();
  return fallbackResult;
}

/**
 * Extract price data from the API response
 */
export function extractPriceData(data: any) {
  if (!data) {
    console.warn('extractPriceData: No data provided');
    return null;
  }

  console.group('Price Data Extraction');
  console.log('Extracting from data structure:', {
    dataType: typeof data,
    topLevelKeys: data ? Object.keys(data) : []
  });

  // Start with direct price fields
  if (data.basePrice || data.reservePrice || data.valuation) {
    console.log('Found direct price fields at top level');
    const result = {
      basePrice: Number(data.basePrice || data.valuation || 0),
      reservePrice: Number(data.reservePrice || data.valuation || 0),
      averagePrice: Number(data.averagePrice || data.price_med || data.basePrice || 0)
    };
    console.log('Extracted price data:', result);
    console.groupEnd();
    return result;
  }

  // Look for calcValuation in functionResponse
  if (data.functionResponse?.valuation?.calcValuation) {
    console.log('Found price data in functionResponse.valuation.calcValuation');
    const calcValuation = data.functionResponse.valuation.calcValuation;
    const priceMin = Number(calcValuation.price_min || 0);
    const priceMed = Number(calcValuation.price_med || 0);
    
    // Calculate basePrice from min and med
    const basePrice = (priceMin + priceMed) / 2;
    
    const result = {
      basePrice,
      reservePrice: calculateReservePriceFromBase(basePrice),
      averagePrice: priceMed
    };
    console.log('Extracted price data from functionResponse:', result);
    console.groupEnd();
    return result;
  }

  // Check for price data in rawNestedData
  if (data.rawNestedData && (data.rawNestedData.price_min || data.rawNestedData.price_med)) {
    console.log('Found price data in rawNestedData');
    const priceMin = Number(data.rawNestedData.price_min || 0);
    const priceMed = Number(data.rawNestedData.price_med || 0);
    
    // Calculate basePrice from min and med
    const basePrice = (priceMin + priceMed) / 2;
    
    const result = {
      basePrice,
      reservePrice: calculateReservePriceFromBase(basePrice),
      averagePrice: priceMed
    };
    console.log('Extracted price data from rawNestedData:', result);
    console.groupEnd();
    return result;
  }

  console.warn('Could not find price data in response');
  console.groupEnd();
  return null;
}

/**
 * Calculate reserve price from base price
 */
function calculateReservePriceFromBase(basePrice: number): number {
  if (!basePrice || basePrice <= 0) {
    return 0;
  }
  
  let percentage = 0.25; // Default percentage
  
  if (basePrice <= 15000) percentage = 0.65;
  else if (basePrice <= 20000) percentage = 0.46;
  else if (basePrice <= 30000) percentage = 0.37;
  else if (basePrice <= 50000) percentage = 0.27;
  else if (basePrice <= 60000) percentage = 0.27;
  else if (basePrice <= 70000) percentage = 0.22;
  else if (basePrice <= 80000) percentage = 0.23;
  else if (basePrice <= 100000) percentage = 0.24;
  else if (basePrice <= 130000) percentage = 0.20;
  else if (basePrice <= 160000) percentage = 0.185;
  else if (basePrice <= 200000) percentage = 0.22;
  else if (basePrice <= 250000) percentage = 0.17;
  else if (basePrice <= 300000) percentage = 0.18;
  else if (basePrice <= 400000) percentage = 0.18;
  else if (basePrice <= 500000) percentage = 0.16;
  else percentage = 0.145;
  
  return basePrice - (basePrice * percentage);
}

/**
 * Deeply scan for mileage value in any data structure
 */
function extractMileageFromAnySource(data: any): number {
  if (!data) return 0;
  
  // Check for direct values
  if (typeof data.mileage === 'number') return data.mileage;
  if (typeof data.odometer === 'number') return data.odometer;
  
  // Check nested in functionResponse
  if (data.functionResponse?.userParams?.odometer) 
    return Number(data.functionResponse.userParams.odometer);
    
  if (data.functionResponse?.userParams?.mileage) 
    return Number(data.functionResponse.userParams.mileage);
    
  // Try to find in rawResponse if it exists
  if (data.rawResponse) {
    try {
      const parsed = typeof data.rawResponse === 'string' 
        ? JSON.parse(data.rawResponse) 
        : data.rawResponse;
        
      if (parsed.userParams?.odometer) return Number(parsed.userParams.odometer);
      if (parsed.userParams?.mileage) return Number(parsed.userParams.mileage);
    } catch (e) {
      console.warn('Failed to parse rawResponse', e);
    }
  }
  
  return 0;
}
