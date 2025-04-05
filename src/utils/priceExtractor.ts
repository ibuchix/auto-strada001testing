
/**
 * Enhanced price extractor with better debugging and more robust fallbacks
 */
export const extractPrice = (responseData: any): number | null => {
  console.log('Extracting price from response:', JSON.stringify(responseData, null, 2));

  // If response is empty or invalid
  if (!responseData) {
    console.error('Price extraction failed: Empty response data');
    return null;
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
    responseData?.price_med,
    responseData?.estimated_value,
    responseData?.market_value,
    responseData?.value,
    responseData?.suggested_price
  ].filter(price => typeof price === 'number' && price > 0);

  if (directPriceFields.length > 0) {
    console.log('Found direct price:', directPriceFields[0]);
    return directPriceFields[0];
  }

  // Check for specific API response structure from external valuation API
  if (responseData?.price_min && responseData?.price_med) {
    const basePrice = (Number(responseData.price_min) + Number(responseData.price_med)) / 2;
    if (basePrice > 0) {
      console.log('Calculated base price from min/med:', basePrice);
      return basePrice;
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


