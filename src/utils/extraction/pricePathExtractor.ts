
interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

export function extractNestedPriceData(rawData: any): PriceData {
  // Parse if string
  let data = rawData;
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      console.error('Failed to parse raw JSON:', e);
      return {};
    }
  }

  // Directly access nested calcValuation object
  const calcValuation = data?.functionResponse?.valuation?.calcValuation;
  
  if (!calcValuation) {
    console.error('Failed to find calcValuation in response');
    return {};
  }

  return {
    price: Number(calcValuation.price),
    price_min: Number(calcValuation.price_min),
    price_max: Number(calcValuation.price_max),
    price_avr: Number(calcValuation.price_avr),
    price_med: Number(calcValuation.price_med)
  };
}

export function calculateBasePriceFromNested(priceData: PriceData): number {
  console.log('Calculating base price from nested data:', priceData);
  
  // Use direct price calculation from min and median values
  if (priceData.price_min && priceData.price_med) {
    const basePrice = (Number(priceData.price_min) + Number(priceData.price_med)) / 2;
    console.log('Calculated base price:', basePrice);
    return basePrice;
  }
  
  // Fallback to direct price if available
  if (priceData.price && !isNaN(Number(priceData.price))) {
    console.log('Using direct price:', priceData.price);
    return Number(priceData.price);
  }
  
  console.error('Could not calculate base price - no valid price data');
  return 0;
}
