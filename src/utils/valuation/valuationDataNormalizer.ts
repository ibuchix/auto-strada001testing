
/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
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
  
  // Calculate base price and reserve price
  let basePrice = priceData.valuation || priceData.price || 0;
  let reservePrice = priceData.reservePrice;

  // If we have vehicle details but no price, estimate it
  if (basePrice === 0 && vehicleData.make && vehicleData.model && vehicleData.year > 0) {
    console.log('[VAL-NORM] Estimating price based on vehicle details:', vehicleData);
    basePrice = 15000; // Default estimation
    reservePrice = calculateReservePrice(basePrice);
  }

  const normalized: ValuationData = {
    ...vehicleData,
    transmission: (rawData.transmission || 'manual') as TransmissionType,
    valuation: basePrice,
    reservePrice: reservePrice || calculateReservePrice(basePrice),
    averagePrice: priceData.averagePrice || basePrice,
    basePrice,
    apiSource: rawData.apiSource,
    valuationDate: rawData.valuationDate || new Date().toISOString(),
    usingFallbackEstimation: basePrice === 0,
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
