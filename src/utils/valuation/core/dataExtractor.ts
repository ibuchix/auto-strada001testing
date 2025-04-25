
/**
 * Vehicle data extraction utility
 * Created: 2025-05-01
 * Updated: 2025-05-07 - Improved direct data extraction from nested API structure
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
      transmission: data.transmission || 'manual'
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
      transmission: userParams.gearbox || data.transmission || 'manual'
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
      transmission: data.transmission || 'manual'
    };
    console.log('Extracted vehicle data from rawNestedData:', result);
    console.groupEnd();
    return result;
  }

  console.warn('Could not find vehicle data in response');
  console.groupEnd();
  return null;
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
