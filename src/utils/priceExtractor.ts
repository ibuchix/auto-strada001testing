
/**
 * Enhanced price extractor with better debugging and more robust fallbacks
 * Modified: 2025-04-17 - Improved extraction from external API response formats
 */
export const extractPrice = (responseData: any): number | null => {
  console.log('Extracting price from response:', JSON.stringify(responseData, null, 2).substring(0, 1000));

  // If response is empty or invalid
  if (!responseData) {
    console.error('Price extraction failed: Empty response data');
    return null;
  }

  // Check for Auto ISO API specific fields first (the external valuation API)
  if (responseData.price_min !== undefined && responseData.price_med !== undefined) {
    // This is the format from the Auto ISO API - calculate base price as specified
    const basePrice = (Number(responseData.price_min) + Number(responseData.price_med)) / 2;
    if (basePrice > 0) {
      console.log('AUTO ISO API: Calculated base price from min/med:', basePrice);
      return basePrice;
    }
  }
  
  // Direct price fields with validation - check these fields first in order of priority
  const directPriceFields = [
    // Primary fields - these are the most reliable
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

  // New: Try finding average of available price values
  const priceValues = [];
  for (const [key, value] of Object.entries(responseData)) {
    if (
      (key.toLowerCase().includes('price') || 
       key.toLowerCase().includes('value') ||
       key.toLowerCase().includes('cost')) && 
      typeof value === 'number' && 
      value > 0
    ) {
      priceValues.push(value);
    }
  }
  
  if (priceValues.length > 0) {
    const avgPrice = priceValues.reduce((sum, val) => sum + val, 0) / priceValues.length;
    console.log('Calculated average price from', priceValues.length, 'values:', avgPrice);
    return avgPrice;
  }

  // Recursive search for any valid price field
  const findPrice = (obj: any, depth = 0): number | null => {
    if (!obj || typeof obj !== 'object' || depth > 4) return null;
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if the current value is a valid price
      if (
        (key.toLowerCase().includes('price') || 
         key.toLowerCase().includes('value') ||
         key.toLowerCase().includes('amount')) && 
        typeof value === 'number' && 
        value > 0
      ) {
        console.log(`Found nested price in field "${key}":`, value);
        return value;
      }
      
      // Check nested objects with depth limit to prevent infinite recursion
      if (value && typeof value === 'object') {
        const nestedPrice = findPrice(value, depth + 1);
        if (nestedPrice !== null) return nestedPrice;
      }
    }
    return null;
  };

  const recursivePrice = findPrice(responseData);
  if (recursivePrice !== null) {
    console.log('Found price through recursive search:', recursivePrice);
    return recursivePrice;
  }

  // Last resort: look for string values that might contain numbers
  for (const [key, value] of Object.entries(responseData)) {
    if (
      (key.toLowerCase().includes('price') || 
       key.toLowerCase().includes('value')) && 
      typeof value === 'string'
    ) {
      const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      if (!isNaN(numValue) && numValue > 0) {
        console.log(`Parsed numeric value from string field "${key}":`, numValue);
        return numValue;
      }
    }
  }

  console.error('No valid price found in response');
  return null;
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

