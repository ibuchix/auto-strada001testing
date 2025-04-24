
/**
 * Changes made:
 * - 2025-04-24: Refactored to use strict calcValuation price extraction
 * - 2025-04-24: Fixed type compatibility issues with TransmissionType
 */

import { extractVehicleData } from './core/dataExtractor';
import { extractPriceData } from './priceExtractor';
import { calculateReservePrice } from '@/utils/priceUtils';
import { inspectApiResponse } from './apiResponseInspector';
import { ValuationData, TransmissionType } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  // First, deeply inspect the API response
  inspectApiResponse(rawData, 'NORMALIZER');
  
  // Check for valid data
  if (!rawData) {
    console.error('No raw data provided to normalizer');
    return createEmptyValuation();
  }
  
  // Extract vehicle data
  const vehicleData = extractVehicleData(rawData);
  
  // Ensure transmission is a valid TransmissionType
  const safeTransmission: TransmissionType = 
    vehicleData.transmission === 'automatic' ? 'automatic' : 'manual';
  
  // Extract price data - only from calcValuation
  const priceData = extractPriceData(rawData);
  
  if (!priceData) {
    console.error('Failed to extract valid price data from calcValuation');
    return {
      ...vehicleData,
      transmission: safeTransmission,
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0,
      basePrice: 0,
      noData: true,
      error: 'Could not retrieve valid pricing data from valuation service'
    };
  }
  
  // Calculate reserve price using our formula
  const reservePrice = calculateReservePrice(priceData.basePrice);
  
  return {
    ...vehicleData,
    transmission: safeTransmission,
    valuation: priceData.basePrice,
    reservePrice,
    averagePrice: priceData.price_med,
    basePrice: priceData.basePrice,
    noData: false
  };
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
