
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-05-05 - Completely rewritten to directly parse raw API response
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

    // Log the raw data for debugging
    logOperation('raw_data_structure', {
      requestId,
      topLevelKeys: Object.keys(data),
      hasFunctionResponse: !!data?.functionResponse
    });

    // Extract vehicle data from the nested structure
    const userParams = data?.functionResponse?.userParams;
    const calcValuation = data?.functionResponse?.valuation?.calcValuation;

    if (!userParams || !calcValuation) {
      logOperation('missing_required_data_paths', {
        requestId,
        hasUserParams: !!userParams,
        hasCalcValuation: !!calcValuation
      }, 'error');
      throw new Error('Missing required data paths in API response');
    }

    // Extract vehicle details from userParams
    const make = userParams.make || '';
    const model = userParams.model || '';
    const year = parseInt(userParams.year, 10) || 0;
    
    // Extract price data from calcValuation
    const priceMin = parseInt(calcValuation.price_min, 10) || 0;
    const priceMed = parseInt(calcValuation.price_med, 10) || 0;
    const price = parseInt(calcValuation.price, 10) || 0;

    // Log extracted data
    logOperation('extracted_vehicle_data', {
      requestId,
      make,
      model,
      year,
      mileage
    });

    logOperation('extracted_price_data', {
      requestId,
      priceMin,
      priceMed,
      price
    });

    // Validate extracted data
    if (!make || !model || year <= 0) {
      throw new Error('Incomplete vehicle data in API response');
    }

    if (priceMin <= 0 || priceMed <= 0) {
      throw new Error('Invalid price data in API response');
    }

    // Calculate base price
    const basePrice = (priceMin + priceMed) / 2;

    // Calculate reserve price using our pricing tiers
    const reservePrice = calculateReservePrice(basePrice);

    // Return the processed data
    return {
      vin,
      make,
      model,
      year,
      mileage,
      transmission: userParams.gearbox || 'manual',
      price: basePrice,
      price_min: priceMin,
      price_med: priceMed,
      basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: priceMed,
      // Include raw nested data for debugging
      rawNestedData: {
        userParams,
        calcValuation
      }
    };
  } catch (error) {
    logOperation('data_processing_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    throw new Error(`Failed to process valuation data: ${error.message}`);
  }
}

function calculateReservePrice(basePrice: number): number {
  let percentage = 0.65; // Default for prices under 15,000 PLN
  
  if (basePrice > 500000) percentage = 0.145;
  else if (basePrice > 400000) percentage = 0.16;
  else if (basePrice > 300000) percentage = 0.18;
  else if (basePrice > 250000) percentage = 0.17;
  else if (basePrice > 200000) percentage = 0.22;
  else if (basePrice > 160000) percentage = 0.185;
  else if (basePrice > 130000) percentage = 0.20;
  else if (basePrice > 100000) percentage = 0.24;
  else if (basePrice > 80000) percentage = 0.23;
  else if (basePrice > 70000) percentage = 0.22;
  else if (basePrice > 60000) percentage = 0.27;
  else if (basePrice > 50000) percentage = 0.27;
  else if (basePrice > 30000) percentage = 0.37;
  else if (basePrice > 20000) percentage = 0.46;
  else if (basePrice > 15000) percentage = 0.46;
  
  return basePrice - (basePrice * percentage);
}
