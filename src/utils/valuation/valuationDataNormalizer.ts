
/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
 * - 2025-04-21: Enhanced price calculation logic to properly handle nested API response
 * - 2025-04-22: Fixed base price handling and reserve price calculation logic
 * - 2025-04-22: Added support for functionResponse nested structure in API response
 * - 2025-04-23: Updated import paths to use consistent price extraction utilities
 * - 2025-04-24: Enhanced structure detection and added robust multi-path data extraction
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

  // CRITICAL DEBUG - Check for data at expected paths
  console.log('%c🔎 STRUCTURE INSPECTION:', 'background: #333; color: #ff9; font-size: 14px; padding: 5px;');
  
  if (rawData?.functionResponse) {
    console.log('Found functionResponse at root level:', {
      hasUserParams: !!rawData.functionResponse.userParams,
      hasValuation: !!rawData.functionResponse.valuation
    });
  } else if (rawData?.data?.functionResponse) {
    console.log('Found functionResponse in data property:', {
      hasUserParams: !!rawData.data.functionResponse.userParams,
      hasValuation: !!rawData.data.functionResponse.valuation
    });
  } else {
    console.warn('No functionResponse found in any expected location');
  }
  
  // Check for valid data
  if (!rawData) {
    console.error('%c❌ NO VALID DATA FOUND', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
    return createEmptyValuation();
  }

  // Extract core vehicle data with robust extraction
  const vehicleData = extractVehicleData(rawData);
  
  if (!vehicleData || (!vehicleData.make && !vehicleData.model)) {
    console.warn('Vehicle data extraction failed, checking original input');
    // Try to get some data from raw input as a last resort
    if (rawData.make && rawData.model) {
      console.log('Found basic vehicle details in root level');
    } else if (rawData.data?.make && rawData.data?.model) {
      console.log('Found basic vehicle details in data property');
    }
  }
  
  // Extract price data using the dedicated utility
  const priceData = extractNestedPriceData(rawData);
  
  // Check if we got valid price data
  if (!priceData.price_min && !priceData.price_med) {
    console.warn("Could not find price data in the API response");
  }
  
  const basePrice = calculateBasePriceFromNested(priceData);
  
  // Log the extracted price data
  console.log('[VAL-NORM] Extracted price data:', {
    basePrice,
    priceData
  });
  
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
