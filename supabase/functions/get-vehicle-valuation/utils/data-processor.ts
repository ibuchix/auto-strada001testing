
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-05-05 - Enhanced error handling and validation
 */

import { logOperation } from "./logging.ts";
import { calculateReservePrice } from "./utils.ts";
import { validateValuationResponse } from "./validation.ts";

export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  try {
    // First validate the response
    const validation = validateValuationResponse(rawData);
    
    // Log validation results
    logOperation('validation_result', {
      requestId,
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      errors: validation.errors
    });

    if (!validation.isValid) {
      // Log detailed validation errors
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

    // Calculate base price from validated data
    const basePrice = (data.price_min + data.price_med) / 2;
    const reservePrice = calculateReservePrice(basePrice);

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

    // Return processed data
    return {
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
  } catch (error) {
    logOperation('data_processing_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    throw error;
  }
}

