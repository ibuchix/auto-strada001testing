export const extractPrice = (responseData: any): number | null => {
  console.log('Extracting price from API response:', JSON.stringify(responseData, null, 2));

  // Direct price field
  if (typeof responseData?.price === 'number') {
    return responseData.price;
  }

  // Check valuation object
  if (typeof responseData?.valuation?.price === 'number') {
    return responseData.valuation.price;
  }

  // Check functionResponse object
  if (typeof responseData?.functionResponse?.price === 'number') {
    return responseData.functionResponse.price;
  }

  // Check nested valuation object
  if (typeof responseData?.functionResponse?.valuation?.price === 'number') {
    return responseData.functionResponse.valuation.price;
  }

  // Check for any numeric price field recursively
  const findPrice = (obj: any): number | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    for (const [key, value] of Object.entries(obj)) {
      if (key.toLowerCase().includes('price') && typeof value === 'number') {
        return value;
      }
      if (typeof value === 'object') {
        const nestedPrice = findPrice(value);
        if (nestedPrice !== null) return nestedPrice;
      }
    }
    return null;
  };

  return findPrice(responseData);
};