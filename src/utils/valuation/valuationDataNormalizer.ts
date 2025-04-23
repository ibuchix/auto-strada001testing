
/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
 * - 2025-04-21: Enhanced price calculation logic to properly handle nested API response
 * - 2025-04-22: Fixed base price handling and reserve price calculation logic
 * - 2025-04-22: Added support for functionResponse nested structure in API response
 * - 2025-04-23: Updated import paths to use consistent price extraction utilities
 * - 2025-04-24: Enhanced structure detection and added robust multi-path data extraction
 * - 2025-04-26: Updated to use enhanced extraction with better fallback handling
 * - 2025-04-27: Removed fallbacks for price calculations to ensure accuracy
 */

import { extractVehicleData } from './core/dataExtractor';
import { extractNestedPriceData, calculateBasePriceFromNested } from '@/utils/extraction/pricePathExtractor';
import { calculateReservePrice } from '@/utils/priceUtils';
import { ValuationData, TransmissionType } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  console.log('%c🔬 VALUATION NORMALIZATION STARTED', 'background: #FF5722; color: white; font-size: 16px; padding: 4px 8px; border-radius: 4px', {
    hasRawData: !!rawData,
    dataKeys: rawData ? Object.keys(rawData) : [],
    hasData: !!rawData?.data,
    hasFunctionResponse: !!rawData?.functionResponse,
    hasNestedFunctionResponse: !!rawData?.data?.functionResponse
  });

  // Check for valid data
  if (!rawData) {
    console.error('%c❌ NO VALID DATA FOUND', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
    return createEmptyValuation();
  }

  // Extract core vehicle data with better field handling
  const vehicleData = extractVehicleData(rawData);
  
  // Extract price data with enhanced detection
  const priceData = extractNestedPriceData(rawData);
  
  // Calculate base price - REMOVED FALLBACKS to ensure accuracy
  const basePrice = calculateBasePriceFromNested(priceData);
  
  // Log the extracted price data
  console.log('[VAL-NORM] Extracted price data:', {
    basePrice,
    priceData
  });
  
  // If we have no base price, we shouldn't proceed with calculations
  if (basePrice <= 0) {
    console.error('%c❌ NO VALID PRICE DATA FOUND', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
    
    // Return vehicle data but mark pricing as invalid
    return {
      ...vehicleData,
      transmission: (vehicleData.transmission || 'manual') as TransmissionType,
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0,
      basePrice: 0,
      noData: true,
      error: 'Could not retrieve valid pricing data'
    };
  }
  
  console.log('%c💰 EXTRACTED PRICE DATA', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    basePrice,
    priceMin: priceData.price_min,
    priceMed: priceData.price_med,
    priceMax: priceData.price_max
  });

  // Calculate the reserve price based on our base price
  const reservePrice = calculateReservePrice(basePrice);
  
  // Log final reserve price calculation
  console.log('%c💵 RESERVE PRICE CALCULATION', 'background: #FF9800; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
    basePrice,
    reservePrice
  });

  // Special handling: if we have vehicle data but no price data, log this issue
  if (vehicleData.make && vehicleData.model && basePrice === 0) {
    console.warn('%c⚠️ VEHICLE FOUND BUT NO PRICE DATA', 'background: #FF9800; color: black; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year
    });
  }

  const normalized: ValuationData = {
    ...vehicleData,
    transmission: (vehicleData.transmission || 'manual') as TransmissionType,
    valuation: basePrice,
    reservePrice: reservePrice,
    averagePrice: priceData.price_med || 0,
    basePrice: basePrice,
    apiSource: rawData.apiSource || (rawData.functionResponse ? 'auto_iso_api' : 'unknown'),
    valuationDate: rawData.valuationDate || new Date().toISOString(),
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
