
/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
 * - 2025-04-21: Enhanced price calculation logic to properly handle nested API response
 */

import { extractVehicleData, extractPriceData } from './core/dataExtractor';
import { validateVehicleData, validatePriceData } from './core/dataValidator';
import { ValuationData, TransmissionType, calculateReservePrice } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  console.log('[VAL-NORM] INPUT RAW valuation data:', JSON.stringify(rawData));
  
  if (!rawData) {
    console.warn('[VAL-NORM] No valid data found in response');
    return createEmptyValuation();
  }

  // Extract core vehicle and price data
  const vehicleData = extractVehicleData(rawData);
  const priceData = extractPriceData(rawData);
  
  // Calculate reserve price if not provided
  const reservePrice = priceData.reservePrice || 
    (priceData.basePrice > 0 ? calculateReservePrice(priceData.basePrice) : 0);

  const normalized: ValuationData = {
    ...vehicleData,
    transmission: (rawData.transmission || 'manual') as TransmissionType,
    valuation: priceData.basePrice,
    reservePrice: reservePrice,
    averagePrice: priceData.averagePrice,
    basePrice: priceData.basePrice,
    apiSource: rawData.apiSource,
    valuationDate: rawData.valuationDate || new Date().toISOString(),
    usingFallbackEstimation: rawData.usingFallbackEstimation || false,
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
