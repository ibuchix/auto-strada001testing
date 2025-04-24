
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-04-29 - ENHANCED LOGGING FOR DEBUGGING
 * Updated: 2025-04-24 - Fixed nested JSON structure traversal and price extraction
 */

import { logOperation } from "./logging.ts";
import { estimateBasePriceByModel } from "./price-estimator.ts";
import { calculateReservePrice } from "./price-calculator.ts";

/**
 * Extract and process valuation data from API response
 */
export function processValuationData(rawData: any, vin: string, mileage: number, requestId: string) {
  // Deep analysis of the response structure
  logOperation('data_processor_input', {
    requestId,
    hasRawData: !!rawData,
    rawDataKeys: rawData ? Object.keys(rawData) : [],
    rawDataSize: rawData ? JSON.stringify(rawData).length : 0,
    timestamp: new Date().toISOString()
  });
  
  // Safety check for null data
  if (!rawData) {
    logOperation('process_data_null_input', { requestId }, 'error');
    return {
      make: '',
      model: '',
      year: 0,
      basePrice: 0,
      reservePrice: 0,
      valuation: 0,
      usingFallbackEstimation: true
    };
  }
  
  // Attempt to parse the raw response if it's a string (some APIs return JSON as string)
  let parsedData = rawData;
  if (typeof rawData === 'string') {
    try {
      parsedData = JSON.parse(rawData);
      logOperation('parsed_string_response', {
        requestId,
        success: true
      });
    } catch (e) {
      logOperation('failed_to_parse_string_response', {
        requestId,
        error: e.message
      }, 'error');
    }
  }
  
  // Check for JSON response wrapped in rawResponse field
  if (rawData.rawResponse && typeof rawData.rawResponse === 'string') {
    try {
      const parsedRawResponse = JSON.parse(rawData.rawResponse);
      if (parsedRawResponse) {
        logOperation('found_nested_raw_response', {
          requestId,
          hasNestedFunctionResponse: !!parsedRawResponse.functionResponse
        });
        parsedData = parsedRawResponse;
      }
    } catch (e) {
      logOperation('failed_to_parse_raw_response', {
        requestId,
        error: e.message
      }, 'error');
    }
  }
  
  // Extract nested data from correct path
  const functionResponse = parsedData.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Log detailed extraction paths
  logOperation('data_extraction_paths', {
    requestId,
    hasFunctionResponse: !!parsedData.functionResponse,
    hasUserParams: !!functionResponse.userParams,
    hasCalcValuation: !!functionResponse.valuation?.calcValuation,
    calcValuationKeys: Object.keys(functionResponse.valuation?.calcValuation || {}),
    timestamp: new Date().toISOString()
  });
  
  // Extract vehicle details from userParams first, then fall back to other fields
  const make = userParams.make || parsedData.make || '';
  const model = userParams.model || parsedData.model || '';
  const year = userParams.year || parsedData.year || 0;
  
  // Log the extracted basic vehicle data
  logOperation('extracted_vehicle_data', {
    requestId,
    make,
    model,
    year,
    vin,
    mileage,
    timestamp: new Date().toISOString()
  });
  
  // Extract price data from calcValuation
  const priceMin = calcValuation.price_min || 0;
  const priceMed = calcValuation.price_med || 0;
  const directPrice = calcValuation.price || 0;
  
  // Log all price-related fields found
  logOperation('price_calculation', {
    requestId,
    priceMin,
    priceMed,
    directPrice,
    isUsingFallback: false
  });
  
  // Calculate base price if we have price min and med
  let basePrice = 0;
  let usingFallbackEstimation = false;
  
  if (priceMin > 0 && priceMed > 0) {
    // Use API price data (average of min and med)
    basePrice = (priceMin + priceMed) / 2;
    logOperation('using_api_price_data', {
      requestId,
      priceMin,
      priceMed,
      calculatedBasePrice: basePrice,
      timestamp: new Date().toISOString()
    });
  } else if (directPrice > 0) {
    // Use direct valuation
    basePrice = directPrice;
    logOperation('using_direct_valuation', {
      requestId,
      directPrice,
      timestamp: new Date().toISOString()
    });
  } else if (make && model && year > 0) {
    // Estimate price based on vehicle details
    basePrice = estimateBasePriceByModel(make, model, year, requestId);
    usingFallbackEstimation = true;
    logOperation('using_estimated_price', {
      requestId,
      make,
      model,
      year,
      estimatedBasePrice: basePrice,
      timestamp: new Date().toISOString()
    });
  } else {
    // Default fallback
    basePrice = 50000; // Sensible default
    usingFallbackEstimation = true;
    logOperation('using_default_price', {
      requestId,
      defaultBasePrice: basePrice,
      timestamp: new Date().toISOString()
    });
  }
  
  // Calculate reserve price
  const reservePrice = calculateReservePrice(basePrice);
  
  // Log final formula and result
  logOperation('reserve_price_calculated', {
    requestId,
    basePrice,
    percentage: basePrice <= 15000 ? 0.65 : 0.46,
    reservePrice,
    formula: `${basePrice} - (${basePrice} × ${basePrice <= 15000 ? 0.65 : 0.46})`
  });
  
  // Log final processed data
  const result = {
    make,
    model,
    year,
    transmission: userParams.transmission || parsedData.transmission || '',
    vin,
    mileage,
    basePrice,
    reservePrice,
    price: basePrice,
    valuation: directPrice || basePrice,
    averagePrice: priceMed || basePrice,
    usingFallbackEstimation
  };
  
  logOperation('final_result', {
    requestId,
    result
  });
  
  // Return processed data
  return result;
}
