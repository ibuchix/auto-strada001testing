
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-05-06 - Added detailed logging throughout extraction process
 */

import { logOperation } from "./logging.ts";
import { calculateReservePrice } from "./utils.ts";
import { validateValuationResponse } from "./validation.ts";

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // Log the raw data received
    console.log(`[DATA-PROCESSOR][${requestId}] Processing raw data:`, {
      dataType: typeof rawData,
      isNull: rawData === null,
      isUndefined: rawData === undefined,
      dataLength: typeof rawData === 'string' ? rawData.length : (rawData ? JSON.stringify(rawData).length : 0)
    });

    if (typeof rawData === 'string' && rawData.length > 0) {
      console.log(`[DATA-PROCESSOR][${requestId}] String data sample:`, rawData.substring(0, 200) + '...');
    } else if (rawData && typeof rawData === 'object') {
      console.log(`[DATA-PROCESSOR][${requestId}] Object keys:`, Object.keys(rawData));
      
      // Log critical paths for debugging
      console.log(`[DATA-PROCESSOR][${requestId}] Key path check:`, {
        hasFunctionResponse: !!rawData.functionResponse,
        hasUserParams: !!rawData.functionResponse?.userParams,
        hasValuation: !!rawData.functionResponse?.valuation,
        hasCalcValuation: !!rawData.functionResponse?.valuation?.calcValuation
      });
      
      // Log critical data that should be present
      if (rawData.functionResponse?.userParams) {
        console.log(`[DATA-PROCESSOR][${requestId}] User params found:`, {
          make: rawData.functionResponse.userParams.make,
          model: rawData.functionResponse.userParams.model,
          year: rawData.functionResponse.userParams.year
        });
      }
      
      if (rawData.functionResponse?.valuation?.calcValuation) {
        console.log(`[DATA-PROCESSOR][${requestId}] Pricing data found:`, {
          price_min: rawData.functionResponse.valuation.calcValuation.price_min,
          price_med: rawData.functionResponse.valuation.calcValuation.price_med
        });
      }
    }

    // First validate the response
    console.log(`[DATA-PROCESSOR][${requestId}] Starting validation`);
    const validation = validateValuationResponse(rawData);
    
    // Log validation results
    console.log(`[DATA-PROCESSOR][${requestId}] Validation result:`, {
      isValid: validation.isValid,
      errorCount: validation.errors.length
    });
    
    logOperation('validation_result', {
      requestId,
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      errors: validation.errors
    });

    if (!validation.isValid) {
      // Log detailed validation errors
      console.log(`[DATA-PROCESSOR][${requestId}] Validation errors:`, validation.errors);
      
      validation.errors.forEach(error => {
        logOperation('validation_error', {
          requestId,
          code: error.code,
          message: error.message,
          path: error.path,
          value: error.value
        }, 'error');
      });

      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const { data } = validation;
    console.log(`[DATA-PROCESSOR][${requestId}] Validated data:`, {
      make: data.make,
      model: data.model,
      year: data.year,
      price_min: data.price_min,
      price_med: data.price_med
    });

    // Calculate base price from validated data
    console.log(`[DATA-PROCESSOR][${requestId}] Calculating base price from:`, {
      price_min: data.price_min,
      price_med: data.price_med
    });
    
    const basePrice = (data.price_min + data.price_med) / 2;
    console.log(`[DATA-PROCESSOR][${requestId}] Base price calculated:`, basePrice);
    
    // Calculate reserve price
    console.log(`[DATA-PROCESSOR][${requestId}] Calculating reserve price from base price:`, basePrice);
    const reservePrice = calculateReservePrice(basePrice);
    console.log(`[DATA-PROCESSOR][${requestId}] Reserve price calculated:`, reservePrice);

    // Log successful processing
    logOperation('data_processing_success', {
      requestId,
      vin,
      make: data.make,
      model: data.model,
      year: data.year,
      basePrice,
      reservePrice
    });

    // Prepare the final data object
    const result = {
      vin,
      make: data.make,
      model: data.model,
      year: data.year,
      mileage,
      transmission: data.transmission,
      basePrice,
      valuation: basePrice,
      reservePrice,
      averagePrice: data.price_med,
      // Include raw data for debugging
      rawNestedData: {
        userParams: validation.data.rawResponse.functionResponse.userParams,
        calcValuation: validation.data.rawResponse.functionResponse.valuation.calcValuation
      }
    };
    
    // Log the final result object before returning
    console.log(`[DATA-PROCESSOR][${requestId}] Final result object:`, {
      vin: result.vin,
      make: result.make,
      model: result.model,
      year: result.year,
      basePrice: result.basePrice,
      reservePrice: result.reservePrice,
      hasRawData: !!result.rawNestedData
    });
    
    return result;
  } catch (error) {
    console.error(`[DATA-PROCESSOR][${requestId}] Error processing data:`, {
      message: error.message,
      stack: error.stack
    });
    
    logOperation('data_processing_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    throw error;
  }
}
