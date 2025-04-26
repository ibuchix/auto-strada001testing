
/**
 * Changes made:
 * - 2025-04-26: Simplified data processing to directly use raw API response
 * - 2025-04-26: Added direct extraction of price data from calcValuation
 */

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // Parse the raw response if it's a string
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    
    // Get the function response which contains all our needed data
    const functionResponse = data.functionResponse;
    if (!functionResponse) {
      throw new Error('Invalid API response - missing functionResponse');
    }

    // Extract vehicle data from userParams
    const userParams = functionResponse.userParams;
    const calcValuation = functionResponse.valuation?.calcValuation;

    if (!userParams || !calcValuation) {
      throw new Error('Missing required data from API response');
    }

    // Calculate base price (average of min and median)
    const basePrice = (Number(calcValuation.price_min) + Number(calcValuation.price_med)) / 2;
    
    // Calculate reserve price based on our pricing tiers
    let reservePercentage = 0.25; // Default percentage
    
    if (basePrice <= 15000) reservePercentage = 0.65;
    else if (basePrice <= 20000) reservePercentage = 0.46;
    else if (basePrice <= 30000) reservePercentage = 0.37;
    else if (basePrice <= 50000) reservePercentage = 0.27;
    else if (basePrice <= 60000) reservePercentage = 0.27;
    else if (basePrice <= 70000) reservePercentage = 0.22;
    else if (basePrice <= 80000) reservePercentage = 0.23;
    else if (basePrice <= 100000) reservePercentage = 0.24;
    else if (basePrice <= 130000) reservePercentage = 0.20;
    else if (basePrice <= 160000) reservePercentage = 0.185;
    else if (basePrice <= 200000) reservePercentage = 0.22;
    else if (basePrice <= 250000) reservePercentage = 0.17;
    else if (basePrice <= 300000) reservePercentage = 0.18;
    else if (basePrice <= 400000) reservePercentage = 0.18;
    else if (basePrice <= 500000) reservePercentage = 0.16;
    else reservePercentage = 0.145;

    const reservePrice = basePrice - (basePrice * reservePercentage);

    // Return properly structured data with all required fields
    return {
      vin,
      make: userParams.make || '',
      model: userParams.model || '',
      year: Number(userParams.year) || 0,
      mileage: Number(mileage) || Number(userParams.odometer) || 0,
      transmission: userParams.gearbox || 'manual',
      valuation: basePrice,
      reservePrice: Math.round(reservePrice),
      averagePrice: Number(calcValuation.price_med),
      basePrice: Math.round(basePrice),
      // Include raw calculation data for transparency
      rawPricing: {
        min: calcValuation.price_min,
        max: calcValuation.price_max,
        median: calcValuation.price_med,
        average: calcValuation.price_avr
      }
    };
  } catch (error) {
    console.error(`[DATA-PROCESSOR][${requestId}] Error:`, error);
    throw error;
  }
}
