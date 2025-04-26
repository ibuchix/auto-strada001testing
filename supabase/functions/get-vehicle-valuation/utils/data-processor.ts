
/**
 * Changes made:
 * - 2025-04-26: Completely redesigned to directly use raw API response
 * - 2025-04-26: Simplified data extraction with direct path targeting
 */

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // Parse the raw response if it's a string
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    
    // Log the data to help with debugging
    console.log(`[DATA-PROCESSOR][${requestId}] Processing data:`, {
      hasData: !!data,
      dataType: typeof data,
      keys: data ? Object.keys(data) : []
    });

    // Check if we have the expected structure
    if (!data || !data.functionResponse) {
      throw new Error('Invalid API response - missing functionResponse');
    }
    
    // Get direct reference to the key structures we need
    const userParams = data.functionResponse.userParams || {};
    const calcValuation = data.functionResponse.valuation?.calcValuation || {};
    
    // Log what we found for debugging
    console.log(`[DATA-PROCESSOR][${requestId}] Extracted data:`, {
      userParams: !!userParams,
      calcValuation: !!calcValuation
    });
    
    // Directly get the values we need from the response
    const make = userParams.make || '';
    const model = userParams.model || '';
    const year = parseInt(userParams.year) || 0;
    const actualMileage = mileage || parseInt(userParams.odometer) || 0;
    const transmission = userParams.gearbox || 'manual';
    
    // Get price data - provide fallbacks but log warnings if missing
    const priceMin = parseFloat(calcValuation.price_min) || 0;
    const priceMed = parseFloat(calcValuation.price_med) || 0;
    
    if (!priceMin || !priceMed) {
      console.warn(`[DATA-PROCESSOR][${requestId}] Missing price data:`, {
        priceMin,
        priceMed,
        calcValuation
      });
    }
    
    // Calculate base price (average of min and median)
    const basePrice = (priceMin + priceMed) / 2;
    
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
    
    // Log the calculated values
    console.log(`[DATA-PROCESSOR][${requestId}] Calculated values:`, {
      basePrice,
      reservePercentage,
      reservePrice: Math.round(reservePrice)
    });

    // Return a simple object with all the data we need
    return {
      vin,
      make,
      model,
      year,
      mileage: actualMileage,
      transmission,
      valuation: Math.round(basePrice),
      reservePrice: Math.round(reservePrice),
      averagePrice: Math.round(priceMed),
      basePrice: Math.round(basePrice),
      // Include raw calculation data for transparency
      rawPricing: {
        min: priceMin,
        max: calcValuation.price_max,
        median: priceMed,
        average: calcValuation.price_avr
      }
    };
  } catch (error) {
    console.error(`[DATA-PROCESSOR][${requestId}] Error:`, error);
    throw error;
  }
}
