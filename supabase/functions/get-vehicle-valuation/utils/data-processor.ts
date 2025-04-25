
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-05-06 - Fixed data extraction from nested API response
 */

import { logOperation } from "./logging.ts";
import { calculateReservePrice } from "./utils.ts";
import { validateValuationResponse } from "./validation.ts";

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // Log raw response for debugging
    console.log(`[DATA-PROCESSOR][${requestId}] Processing raw data:`, {
      dataType: typeof rawData,
      isNull: rawData === null,
      isUndefined: rawData === undefined,
      dataLength: typeof rawData === 'string' ? rawData.length : (rawData ? JSON.stringify(rawData).length : 0)
    });

    // Parse string response if needed
    let data = rawData;
    if (typeof rawData === 'string') {
      try {
        data = JSON.parse(rawData);
        console.log(`[DATA-PROCESSOR][${requestId}] Successfully parsed string response`);
      } catch (e) {
        console.error(`[DATA-PROCESSOR][${requestId}] Failed to parse string response:`, e);
        throw new Error('Invalid response format');
      }
    }

    // First get the functionResponse object which contains all the data
    const functionResponse = data?.functionResponse;
    if (!functionResponse) {
      console.error(`[DATA-PROCESSOR][${requestId}] Missing functionResponse object`);
      throw new Error('Invalid API response structure');
    }

    // Extract vehicle details from userParams
    const userParams = functionResponse.userParams;
    if (!userParams) {
      console.error(`[DATA-PROCESSOR][${requestId}] Missing userParams in functionResponse`);
      throw new Error('Missing vehicle details');
    }

    console.log(`[DATA-PROCESSOR][${requestId}] Found vehicle details:`, {
      make: userParams.make,
      model: userParams.model,
      year: userParams.year
    });

    // Extract pricing data from calcValuation
    const calcValuation = functionResponse.valuation?.calcValuation;
    if (!calcValuation) {
      console.error(`[DATA-PROCESSOR][${requestId}] Missing calcValuation in functionResponse`);
      throw new Error('Missing price data');
    }

    console.log(`[DATA-PROCESSOR][${requestId}] Found price data:`, {
      price_min: calcValuation.price_min,
      price_med: calcValuation.price_med
    });

    // Calculate base price from min and median
    const basePrice = (calcValuation.price_min + calcValuation.price_med) / 2;
    console.log(`[DATA-PROCESSOR][${requestId}] Calculated base price:`, basePrice);

    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice);
    console.log(`[DATA-PROCESSOR][${requestId}] Calculated reserve price:`, reservePrice);

    // Prepare the result object with all required data
    const result = {
      vin,
      make: userParams.make,
      model: userParams.model,
      year: userParams.year,
      mileage,
      transmission: userParams.gearbox || 'manual',
      basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: calcValuation.price_med,
      // Include raw nested data for debugging
      rawNestedData: {
        userParams,
        calcValuation
      }
    };

    // Log the final structured result
    console.log(`[DATA-PROCESSOR][${requestId}] Final result:`, {
      make: result.make,
      model: result.model,
      year: result.year,
      basePrice: result.basePrice,
      reservePrice: result.reservePrice
    });

    return result;
  } catch (error) {
    console.error(`[DATA-PROCESSOR][${requestId}] Error processing data:`, {
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}
