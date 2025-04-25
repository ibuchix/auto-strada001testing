
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-05-05 - Rewritten for direct nested data access
 */

import { logOperation } from "./logging.ts";
import { calculateReservePrice } from "./utils.ts";

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // First parse the raw response if it's a string
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

    // Log the raw data structure for debugging
    logOperation('raw_data_structure', {
      requestId,
      hasUserParams: !!data?.functionResponse?.userParams,
      hasCalcValuation: !!data?.functionResponse?.valuation?.calcValuation,
      apiStatus: data?.apiStatus
    });

    // Extract vehicle details from userParams
    const userParams = data?.functionResponse?.userParams;
    const calcValuation = data?.functionResponse?.valuation?.calcValuation;

    if (!userParams || !calcValuation) {
      logOperation('missing_required_data', {
        requestId,
        hasUserParams: !!userParams,
        hasCalcValuation: !!calcValuation
      }, 'error');
      throw new Error('Missing required data in API response');
    }

    // Extract and validate vehicle details
    const make = String(userParams.make || '');
    const model = String(userParams.model || '');
    const year = parseInt(userParams.year, 10) || 0;
    
    logOperation('vehicle_data_extracted', {
      requestId,
      make,
      model,
      year
    });

    // Extract and validate price data
    const priceMin = parseInt(calcValuation.price_min, 10) || 0;
    const priceMed = parseInt(calcValuation.price_med, 10) || 0;
    const price = parseInt(calcValuation.price, 10) || 0;

    logOperation('price_data_extracted', {
      requestId,
      priceMin,
      priceMed,
      price
    });

    // Validate essential data
    if (!make || !model || year <= 0) {
      throw new Error('Missing vehicle details in API response');
    }

    if (priceMin <= 0 || priceMed <= 0) {
      throw new Error('Invalid price data in API response');
    }

    // Calculate base price and reserve price
    const basePrice = (priceMin + priceMed) / 2;
    const reservePrice = calculateReservePrice(basePrice);

    logOperation('price_calculation', {
      requestId,
      priceMin,
      priceMed,
      basePrice,
      reservePrice
    });

    // Return the processed data
    return {
      vin,
      make,
      model,
      year,
      mileage,
      transmission: userParams.gearbox || 'manual',
      capacity: userParams.capacity,
      fuel: userParams.fuel,
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
    throw error;
  }
}
