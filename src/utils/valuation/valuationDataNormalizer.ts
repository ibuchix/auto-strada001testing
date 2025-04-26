
/**
 * Changes made:
 * - 2025-04-24: Refactored to use strict calcValuation price extraction
 * - 2025-04-24: Fixed type compatibility issues with TransmissionType
 * - 2025-04-25: Added API response inspection and improved error handling
 * - 2025-05-06: Fixed missing required fields in returned ValuationData objects
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
  
  // Check if the API returned an error directly
  if (rawData.error) {
    console.error('API returned error:', rawData.error);
    
    // Extract VIN and mileage if available
    const vin = rawData.vin || '';
    const mileage = rawData.mileage || 0;
    
    return {
      ...createEmptyValuation(),
      vin,              // Include required vin property
      mileage,          // Include required mileage property
      noData: true,
      error: rawData.error
    };
  }
  
  // Extract vehicle data
  const vehicleData = extractVehicleData(rawData);
  
  // Ensure transmission is a valid TransmissionType
  const safeTransmission: TransmissionType = 
    (vehicleData.transmission === 'automatic' || vehicleData.transmission === 'manual') 
    ? vehicleData.transmission as TransmissionType 
    : 'manual';
  
  // Extract price data - only from calcValuation
  const priceData = extractPriceData(rawData);
  
  // Extract VIN and mileage from raw data
  const vin = rawData.vin || '';
  const mileage = rawData.mileage || rawData.odometer || 
                 (rawData.functionResponse?.userParams?.odometer) || 0;
  
  if (!priceData) {
    console.error('Failed to extract valid price data from calcValuation');
    return {
      ...vehicleData,
      vin,              // Include required vin property
      mileage,          // Include required mileage property
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
    vin,              // Include required vin property
    mileage,          // Include required mileage property
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
    vin: '',        // Include required vin property with empty default
    transmission: 'manual' as TransmissionType,
    mileage: 0,     // Include required mileage property with 0 default
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
}
