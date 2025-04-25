
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-04-25 - Completely rewritten to properly handle nested JSON structure
 */

import { logOperation } from "./logging.ts";

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // Parse the raw response if it's a string
    let data = rawData;
    if (typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        logOperation('json_parse_error', { 
          requestId, 
          error: e.message 
        }, 'error');
        throw new Error('Failed to parse API response');
      }
    }

    // Log the data structure we're working with
    logOperation('processing_valuation_data', {
      requestId,
      hasUserParams: !!data?.functionResponse?.userParams,
      hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation
    });

    // Direct access to nested data
    const userParams = data?.functionResponse?.userParams;
    const calcValuation = data?.functionResponse?.valuation?.calcValuation;

    if (!userParams || !calcValuation) {
      logOperation('missing_required_data', {
        requestId,
        hasUserParams: !!userParams,
        hasCalcValuation: !!calcValuation
      }, 'error');
      throw new Error('Missing required valuation data');
    }

    // Extract vehicle details directly from userParams
    const make = userParams.make || '';
    const model = userParams.model || '';
    const year = Number(userParams.year) || new Date().getFullYear();

    // Extract price data directly from calcValuation
    const priceMin = Number(calcValuation.price_min) || 0;
    const priceMed = Number(calcValuation.price_med) || 0;

    // Calculate base price
    const basePrice = (priceMin + priceMed) / 2;

    logOperation('price_calculation', {
      requestId,
      priceMin,
      priceMed,
      basePrice
    });

    // Calculate reserve price based on base price
    let reservePercentage = 0.65; // Default for prices under 15,000 PLN
    if (basePrice > 500000) reservePercentage = 0.145;
    else if (basePrice > 400000) reservePercentage = 0.16;
    else if (basePrice > 300000) reservePercentage = 0.18;
    else if (basePrice > 250000) reservePercentage = 0.18;
    else if (basePrice > 200000) reservePercentage = 0.17;
    else if (basePrice > 160000) reservePercentage = 0.22;
    else if (basePrice > 130000) reservePercentage = 0.185;
    else if (basePrice > 100000) reservePercentage = 0.20;
    else if (basePrice > 80000) reservePercentage = 0.24;
    else if (basePrice > 70000) reservePercentage = 0.23;
    else if (basePrice > 60000) reservePercentage = 0.22;
    else if (basePrice > 50000) reservePercentage = 0.27;
    else if (basePrice > 30000) reservePercentage = 0.27;
    else if (basePrice > 20000) reservePercentage = 0.37;
    else if (basePrice > 15000) reservePercentage = 0.46;

    const reservePrice = basePrice - (basePrice * reservePercentage);

    logOperation('reserve_price_calculated', {
      requestId,
      basePrice,
      percentage: reservePercentage,
      reservePrice,
      formula: `${basePrice} - (${basePrice} × ${reservePercentage})`
    });

    const result = {
      vin,
      make,
      model,
      year,
      mileage,
      price: basePrice,
      valuation: basePrice,
      reservePrice: Math.round(reservePrice),
      averagePrice: priceMed
    };

    logOperation('final_result', {
      requestId,
      result
    });

    return result;
  } catch (error) {
    logOperation('data_processing_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      vin,
      mileage,
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: 0,
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0
    };
  }
}
