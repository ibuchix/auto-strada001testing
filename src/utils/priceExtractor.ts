
export const extractPrice = (responseData: any): number | null => {
  console.log('Extracting price from response:', JSON.stringify(responseData, null, 2));

  // Direct price fields with validation
  const directPrices = [
    responseData?.price,
    responseData?.valuation?.price,
    responseData?.functionResponse?.price,
    responseData?.functionResponse?.valuation?.price,
    responseData?.functionResponse?.valuation?.calcValuation?.price,
    responseData?.estimated_value,
    responseData?.market_value,
    responseData?.value,
    responseData?.suggested_price
  ].filter(price => typeof price === 'number' && price > 0);

  if (directPrices.length > 0) {
    console.log('Found direct price:', directPrices[0]);
    return directPrices[0];
  }

  // Recursive search for any valid price field
  const findPrice = (obj: any, depth = 0): number | null => {
    if (!obj || typeof obj !== 'object' || depth > 3) return null;
    
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
      
      // Recursively check nested objects
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

  console.log('No valid price found in response');
  return null;
};
