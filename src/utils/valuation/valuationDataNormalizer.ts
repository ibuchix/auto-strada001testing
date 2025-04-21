/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
 * - 2025-04-21: Enhanced price calculation logic to properly handle nested API response
 * - 2025-04-21: Added robust fallback price estimation when API returns zeros
 * - 2025-04-22: Fixed base price handling and reserve price calculation logic
 * - 2025-04-22: Added support for functionResponse nested structure in API response
 * - 2025-04-26: Improved logging and prioritization of calcValuation data extraction
 */

import { extractVehicleData, extractPriceData } from './core/dataExtractor';
import { validateVehicleData, validatePriceData } from './core/dataValidator';
import { ValuationData, TransmissionType, calculateReservePrice, estimateBasePriceByModel } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  console.log('%c🔬 VALUATION NORMALIZATION STARTED', 'background: #FF5722; color: white; font-size: 16px; padding: 4px 8px; border-radius: 4px', {
    hasRawData: !!rawData,
    dataKeys: rawData ? Object.keys(rawData) : [],
    hasNestedData: !!rawData?.functionResponse
  });

  // Log the entire raw data structure for comprehensive debugging
  console.log('%c🕵️ RAW DATA FULL STRUCTURE', 'background: #3F51B5; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', 
    JSON.stringify(rawData, null, 2)
  );

  // Existing normalization logic with enhanced error tracking
  if (!rawData) {
    console.error('%c❌ NO VALID DATA FOUND', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
    return createEmptyValuation();
  }

  // Log the structure of the raw data to help with debugging
  console.log('[VAL-NORM] Raw data structure:', {
    hasData: !!rawData.data,
    hasFunctionResponse: !!rawData.functionResponse,
    hasFunctionResponseValuation: !!(rawData.functionResponse?.valuation),
    hasCalcValuation: !!(rawData.functionResponse?.valuation?.calcValuation)
  });

  // If we have functionResponse with calcValuation, log the price data
  if (rawData.functionResponse?.valuation?.calcValuation) {
    const calcVal = rawData.functionResponse.valuation.calcValuation;
    console.log('[VAL-NORM] Found calcValuation price data:', {
      price: calcVal.price,
      price_min: calcVal.price_min,
      price_med: calcVal.price_med,
      price_max: calcVal.price_max,
      price_avr: calcVal.price_avr
    });
  }

  // Extract core vehicle and price data with more detailed logging
  const vehicleData = extractVehicleData(rawData);
  const priceData = extractPriceData(rawData);
  
  // Log the extracted price data
  console.log('[VAL-NORM] Extracted price data:', priceData);
  
  console.log('%c💰 EXTRACTED PRICE DATA', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    basePrice: priceData.basePrice,
    valuation: priceData.valuation,
    averagePrice: priceData.averagePrice
  });

  // Detailed logging for base price calculation
  let basePrice = priceData.basePrice;
  let usingFallbackEstimation = rawData.usingFallbackEstimation || false;
  let estimationMethod = rawData.estimationMethod || undefined;
  
  // Logging for estimation scenarios
  console.log('%c🧮 BASE PRICE ESTIMATION', 'background: #9C27B0; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    basePrice,
    usingFallbackEstimation,
    estimationMethod,
    hasMake: !!vehicleData.make,
    hasModel: !!vehicleData.model,
    hasYear: vehicleData.year > 0
  });
  
  // If no valid base price, try to estimate one based on vehicle data
  if (basePrice <= 0 && vehicleData.make && vehicleData.model && vehicleData.year > 0) {
    console.log('[VAL-NORM] No valid price data, estimating based on vehicle details:', {
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year
    });
    
    // Use our estimation function to get a price based on make/model/year
    basePrice = estimateBasePriceByModel(vehicleData.make, vehicleData.model, vehicleData.year);
    usingFallbackEstimation = true;
    estimationMethod = 'make_model_year';
    
    console.log('[VAL-NORM] Estimated base price:', basePrice);
  }
  
  // If we still have no price, use a default value as absolute last resort
  if (basePrice <= 0) {
    console.warn('[VAL-NORM] Could not estimate price, using default value');
    basePrice = 40000; // Default fallback value
    usingFallbackEstimation = true;
    estimationMethod = 'default_value';
  }
  
  // Now calculate the reserve price based on our base price
  // Either use the provided reserve price or calculate it
  const reservePrice = priceData.reservePrice > 0 
    ? priceData.reservePrice 
    : calculateReservePrice(basePrice);
  
  // Log final reserve price calculation
  console.log('%c💵 RESERVE PRICE CALCULATION', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    basePrice,
    reservePrice,
    usingFallbackEstimation,
    estimationMethod
  });
  
  console.log('[VAL-NORM] Reserve price calculation:', {
    basePrice,
    reservePrice,
    usingFallbackEstimation,
    estimationMethod
  });

  const normalized: ValuationData = {
    ...vehicleData,
    transmission: (rawData.transmission || 'manual') as TransmissionType,
    valuation: basePrice,
    reservePrice: reservePrice,
    averagePrice: priceData.averagePrice > 0 ? priceData.averagePrice : basePrice,
    basePrice: basePrice,
    apiSource: rawData.apiSource || (rawData.functionResponse ? 'auto_iso_api' : 'unknown'),
    valuationDate: rawData.valuationDate || new Date().toISOString(),
    usingFallbackEstimation: usingFallbackEstimation,
    estimationMethod: estimationMethod,
    error: rawData.error,
    noData: rawData.noData,
    isExisting: rawData.isExisting
  };

  console.log('[VAL-NORM] NORMALIZED OUTPUT:', normalized);
  return normalized;
}

function createEmptyValuation(): ValuationData {
  return {
    make: '',
    model: '',
    year: 0,
    vin: '',
    transmission: 'manual',
    mileage: 0,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
}
