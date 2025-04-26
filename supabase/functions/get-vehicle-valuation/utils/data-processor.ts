
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-05-06 - Fixed data extraction from nested API response
 * Updated: 2025-05-07 - Added direct extraction of nested API data
 * Updated: 2025-05-08 - Ensuring VIN and mileage are included in response
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

    // DIRECT EXTRACTION: We know exactly where the data is based on the observed API structure
    // First, get the functionResponse object which contains all the data
    const functionResponse = data?.functionResponse;
    if (!functionResponse) {
      console.error(`[DATA-PROCESSOR][${requestId}] Missing functionResponse object in:`, 
        JSON.stringify(data).substring(0, 200) + '...');
      throw new Error('Invalid API response structure - missing functionResponse');
    }

    // Extract vehicle details DIRECTLY from userParams
    const userParams = functionResponse.userParams;
    if (!userParams) {
      console.error(`[DATA-PROCESSOR][${requestId}] Missing userParams in functionResponse:`, 
        JSON.stringify(functionResponse).substring(0, 200) + '...');
      throw new Error('Missing vehicle details - no userParams');
    }

    // Log the extracted vehicle details
    console.log(`[DATA-PROCESSOR][${requestId}] EXTRACTED vehicle details:`, {
      make: userParams.make,
      model: userParams.model,
      year: userParams.year
    });

    // DIRECT EXTRACTION: Get pricing data directly from calcValuation
    const calcValuation = functionResponse.valuation?.calcValuation;
    if (!calcValuation) {
      console.error(`[DATA-PROCESSOR][${requestId}] Missing calcValuation in functionResponse:`, 
        JSON.stringify(functionResponse.valuation || {}).substring(0, 200) + '...');
      throw new Error('Missing price data - no calcValuation');
    }

    // Log the extracted price data
    console.log(`[DATA-PROCESSOR][${requestId}] EXTRACTED price data:`, {
      price_min: calcValuation.price_min,
      price_med: calcValuation.price_med,
      price: calcValuation.price
    });

    // Ensure we have minimum price data
    if (!calcValuation.price_min || !calcValuation.price_med) {
      console.error(`[DATA-PROCESSOR][${requestId}] Invalid price data:`, calcValuation);
      throw new Error('Missing price data values');
    }

    // Calculate base price from min and median
    const priceMin = Number(calcValuation.price_min);
    const priceMed = Number(calcValuation.price_med);
    const basePrice = (priceMin + priceMed) / 2;
    
    console.log(`[DATA-PROCESSOR][${requestId}] Calculated base price:`, {
      priceMin,
      priceMed,
      basePrice
    });

    // Calculate reserve price
    const reservePrice = calculateReservePrice(basePrice);
    console.log(`[DATA-PROCESSOR][${requestId}] Calculated reserve price:`, reservePrice);

    // Ensure mileage is passed through from input parameter
    const processedMileage = Number(mileage) || Number(userParams.odometer) || 0;
    
    // Prepare the result object with all required data - DIRECT MAPPING
    const result = {
      vin, // Always include the input VIN
      make: userParams.make || '',
      model: userParams.model || '',
      year: userParams.year || 0,
      mileage: processedMileage, // Always include mileage
      transmission: userParams.gearbox || 'manual',
      basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: priceMed,
      // Include simplified raw nested data for debugging
      rawNestedData: {
        make: userParams.make,
        model: userParams.model,
        year: userParams.year,
        price_min: calcValuation.price_min,
        price_med: calcValuation.price_med
      }
    };

    // Additional logging to verify the final output
    console.log(`[DATA-PROCESSOR][${requestId}] FINAL RESULT:`, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error(`[DATA-PROCESSOR][${requestId}] Error processing data:`, {
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}
