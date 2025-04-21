
/**
 * Data processing utilities for vehicle valuation
 * Updated: 2025-04-29 - ENHANCED LOGGING FOR DEBUGGING
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
  
  // Extract nested data if available
  const functionResponse = rawData.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Log detailed extraction paths
  logOperation('data_extraction_paths', {
    requestId,
    hasFunctionResponse: !!rawData.functionResponse,
    hasUserParams: !!functionResponse.userParams,
    hasCalcValuation: !!functionResponse.valuation?.calcValuation,
    timestamp: new Date().toISOString()
  });
  
  // Extract vehicle details (try multiple paths)
  const make = rawData.make || userParams.make || '';
  const model = rawData.model || userParams.model || '';
  const year = rawData.year || userParams.yearOfProduction || 0;
  
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
  
  // Extract price data (try multiple paths)
  const priceMin = rawData.price_min || calcValuation.price_min || 0;
  const priceMed = rawData.price_med || calcValuation.price_med || 0;
  const directValuation = rawData.valuation || 0;
  
  // Log all price-related fields found
  logOperation('all_price_fields', {
    requestId,
    directValuation,
    priceMin,
    priceMed,
    rawReservePrice: rawData.reservePrice,
    rawBasePrice: rawData.basePrice,
    rawAveragePrice: rawData.averagePrice,
    timestamp: new Date().toISOString()
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
  } else if (directValuation > 0) {
    // Use direct valuation
    basePrice = directValuation;
    logOperation('using_direct_valuation', {
      requestId,
      directValuation,
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
  
  // Log final processed data
  logOperation('processed_data_result', {
    requestId,
    make,
    model,
    year,
    basePrice,
    reservePrice,
    usingFallbackEstimation,
    timestamp: new Date().toISOString()
  });
  
  // Return processed data
  return {
    make,
    model,
    year,
    transmission: userParams.transmission || rawData.transmission || '',
    vin,
    mileage,
    basePrice,
    reservePrice,
    valuation: directValuation || basePrice,
    usingFallbackEstimation
  };
}
