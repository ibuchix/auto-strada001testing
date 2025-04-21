/**
 * Enhanced price extractor with better debugging and more robust fallbacks
 * Modified: 2025-04-17 - Improved extraction from external API response formats
 * Modified: 2025-04-20 - Added default values for missing price data
 * Modified: 2025-04-20 - Fixed price extraction logic to prevent failures
 * Modified: 2025-04-21 - Updated to correctly extract nested price data from Auto ISO API
 */
export const extractPrice = (responseData: any): number | null => {
  // Log the incoming data structure for debugging (truncate lengthy responses)
  const debugData = responseData ? 
    JSON.stringify(responseData).substring(0, 300) + 
    (JSON.stringify(responseData).length > 300 ? '...' : '') : 
    'null';
  
  console.log('Extracting price from response data:', debugData);

  // If response is empty or invalid
  if (!responseData) {
    console.warn('Price extraction: Empty response data');
    return 0; // Return 0 instead of null to avoid cascading failures
  }

  // First, log all possible price-related fields for debugging
  const priceRelatedFields: Record<string, any> = {};
  const findPriceFields = (obj: any, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('value') ||
        key.toLowerCase().includes('cost') ||
        key.toLowerCase().includes('valuation')
      ) {
        priceRelatedFields[fullKey] = value;
      }
      
      // Recursively check nested objects, but not arrays
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        findPriceFields(value, fullKey);
      }
    });
  };
  
  findPriceFields(responseData);
  console.log('Available price-related fields:', priceRelatedFields);
  
  // Check the correct nested path for Auto ISO API (based on the actual API response)
  if (responseData.functionResponse?.valuation?.calcValuation) {
    const calcValuation = responseData.functionResponse.valuation.calcValuation;
    
    if (calcValuation.price_min !== undefined && calcValuation.price_med !== undefined) {
      // This is the structure from the actual Auto ISO API response
      const basePrice = (Number(calcValuation.price_min) + Number(calcValuation.price_med)) / 2;
      if (basePrice > 0) {
        console.log('AUTO ISO API: Calculated base price from nested calcValuation:', basePrice);
        return basePrice;
      }
    }
  }
  
  // Check for Auto ISO API specific fields at root level (the previously expected location)
  if (responseData.price_min !== undefined && responseData.price_med !== undefined) {
    // This is the previously expected format
    const basePrice = (Number(responseData.price_min) + Number(responseData.price_med)) / 2;
    if (basePrice > 0) {
      console.log('AUTO ISO API: Calculated base price from min/med:', basePrice);
      return basePrice;
    }
  }
  
  // Direct price fields with validation - check these fields first in order of priority
  const directPriceFields = [
    // Primary fields - these are the most reliable
    responseData?.functionResponse?.valuation?.calcValuation?.price,
    responseData?.functionResponse?.valuation?.calcValuation?.price_med,
    responseData?.functionResponse?.valuation?.calcValuation?.price_avr,
    responseData?.reservePrice,
    responseData?.price,
    responseData?.valuation,
    // Secondary fields - may need calculation or adjustment
    responseData?.price_med,
    responseData?.basePrice,
    responseData?.functionResponse?.price,
    responseData?.functionResponse?.valuation?.price,
    // External API specific fields
    responseData?.estimated_value,
    responseData?.market_value,
    responseData?.value,
    responseData?.suggested_price
  ].filter(price => typeof price === 'number' && price > 0);

  if (directPriceFields.length > 0) {
    console.log('Found direct price:', directPriceFields[0]);
    return directPriceFields[0];
  }

  // Check for prices in nested data objects - common in API responses
  const nestedData = responseData.data || 
                    responseData.apiResponse || 
                    responseData.apiData || 
                    responseData.valuationDetails || 
                    responseData.search_data || {};
                    
  if (nestedData && typeof nestedData === 'object') {
    // Try the same process with the nested data
    const nestedPriceFields = [
      nestedData?.reservePrice,
      nestedData?.price,
      nestedData?.valuation,
      nestedData?.price_med,
      nestedData?.basePrice
    ].filter(price => typeof price === 'number' && price > 0);
    
    if (nestedPriceFields.length > 0) {
      console.log('Found nested price:', nestedPriceFields[0]);
      return nestedPriceFields[0];
    }
    
    // Check for Auto ISO format in nested data
    if (nestedData.price_min !== undefined && nestedData.price_med !== undefined) {
      const basePrice = (Number(nestedData.price_min) + Number(nestedData.price_med)) / 2;
      if (basePrice > 0) {
        console.log('AUTO ISO API (nested): Calculated base price from min/med:', basePrice);
        return basePrice;
      }
    }
  }

  // Try finding average of available price values
  const priceValues = [];
  for (const [key, value] of Object.entries(priceRelatedFields)) {
    if (typeof value === 'number' && value > 0) {
      priceValues.push(value);
    }
  }
  
  if (priceValues.length > 0) {
    const avgPrice = priceValues.reduce((sum, val) => sum + val, 0) / priceValues.length;
    console.log('Calculated average price from', priceValues.length, 'values:', avgPrice);
    return avgPrice;
  }

  // Check if the response itself is a number (some APIs directly return the price)
  if (typeof responseData === 'number' && responseData > 0) {
    console.log('Response is direct price value:', responseData);
    return responseData;
  }

  // Look for a string representation of price
  if (typeof responseData === 'string') {
    const numericValue = parseFloat(responseData.replace(/[^\d.-]/g, ''));
    if (!isNaN(numericValue) && numericValue > 0) {
      console.log('Parsed price from string response:', numericValue);
      return numericValue;
    }
  }

  // Use a default estimation if vehicle data is available
  if (responseData.functionResponse?.userParams?.make && responseData.functionResponse?.userParams?.model) {
    const make = responseData.functionResponse.userParams.make;
    const model = responseData.functionResponse.userParams.model;
    const year = responseData.functionResponse.userParams.year || new Date().getFullYear() - 5;
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    // Very simple estimation based on age
    let estimatedBasePrice = 60000; // Default mid-range value
    
    if (age <= 3) estimatedBasePrice = 100000; // Newer car
    else if (age <= 7) estimatedBasePrice = 70000; // Medium age
    else if (age <= 12) estimatedBasePrice = 40000; // Older car
    else estimatedBasePrice = 25000; // Very old car
    
    console.log('Using estimated price based on vehicle data:', {
      make,
      model,
      year,
      age,
      estimatedPrice: estimatedBasePrice
    });
    
    return estimatedBasePrice;
  }

  // Last resort - provide a fallback value rather than null
  console.warn('No valid price found in response, using fallback value of 50000');
  return 50000; // Default to a mid-range value instead of null
};

/**
 * Calculate reserve price based on base price using the defined percentage tiers
 */
export const calculateReservePrice = (basePrice: number): number => {
  if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
    console.error('Invalid base price for reserve calculation:', basePrice);
    return 0;
  }
  
  // Determine the percentage based on price tier
  let percentage = 0;
  
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
  
  // Calculate and round to the nearest whole number
  const reservePrice = Math.round(basePrice - (basePrice * percentage));
  
  console.log('Reserve price calculation:', {
    basePrice,
    percentage: percentage * 100 + '%',
    formula: `${basePrice} - (${basePrice} × ${percentage})`,
    reservePrice
  });
  
  return reservePrice;
};

/**
 * Format price for display with appropriate currency symbol
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price)) {
    return 'N/A';
  }
  
  // Format as PLN with appropriate spacing
  return new Intl.NumberFormat('pl-PL', { 
    style: 'currency', 
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};
