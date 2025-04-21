
/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
 * - 2025-04-21: Enhanced price calculation logic to properly handle nested API response
 * - 2025-04-21: Added robust fallback price estimation when API returns zeros
 * - 2025-04-22: Fixed base price handling and reserve price calculation logic
 */

import { extractVehicleData, extractPriceData } from './core/dataExtractor';
import { validateVehicleData, validatePriceData } from './core/dataValidator';
import { ValuationData, TransmissionType, calculateReservePrice, estimateBasePriceByModel } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  console.log('[VAL-NORM] INPUT RAW valuation data:', JSON.stringify(rawData));
  
  if (!rawData) {
    console.warn('[VAL-NORM] No valid data found in response');
    return createEmptyValuation();
  }

  // Extract core vehicle and price data
  const vehicleData = extractVehicleData(rawData);
  const priceData = extractPriceData(rawData);
  
  // Handle the case where we need to use fallback estimation
  let basePrice = priceData.basePrice;
  let usingFallbackEstimation = rawData.usingFallbackEstimation || false;
  let estimationMethod = rawData.estimationMethod || undefined;
  
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
    apiSource: rawData.apiSource,
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
