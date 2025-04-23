
/**
 * Changes made:
 * - 2025-04-21: Refactored to use separate data extraction and validation utilities
 * - 2025-04-21: Enhanced price calculation logic to properly handle nested API response
 * - 2025-04-22: Fixed base price handling and reserve price calculation logic
 * - 2025-04-22: Added support for functionResponse nested structure in API response
 * - 2025-04-23: Updated import paths to use consistent price extraction utilities
 */

import { extractVehicleData } from './core/dataExtractor';
import { extractNestedPriceData, calculateBasePriceFromNested } from '@/utils/extraction/pricePathExtractor';
import { calculateReservePrice } from '@/utils/priceUtils';
import { ValuationData, TransmissionType } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  console.log('%c🔬 VALUATION NORMALIZATION STARTED', 'background: #FF5722; color: white; font-size: 16px; padding: 4px 8px; border-radius: 4px', {
    hasRawData: !!rawData,
    dataKeys: rawData ? Object.keys(rawData) : [],
    hasNestedData: !!rawData?.functionResponse
  });

  // CRITICAL DEBUG - Log the entire incoming raw data structure
  console.log('%c🔎 FULL RAW DATA IN NORMALIZER:', 'background: #333; color: #ff9; font-size: 14px; padding: 5px;', JSON.stringify(rawData, null, 2));
  
  // Check for functionResponse structure
  if (rawData?.functionResponse) {
    console.log('%c🔍 FUNCTION RESPONSE FOUND', 'background: #4CAF50; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
      hasUserParams: !!rawData.functionResponse.userParams,
      hasValuation: !!rawData.functionResponse.valuation,
      hasCalcValuation: !!rawData.functionResponse.valuation?.calcValuation,
      calcValuationKeys: rawData.functionResponse.valuation?.calcValuation ? 
                         Object.keys(rawData.functionResponse.valuation.calcValuation) : []
    });
    
    // Check for price data in nested structure
    if (rawData.functionResponse.valuation?.calcValuation) {
      const calcVal = rawData.functionResponse.valuation.calcValuation;
      console.log('%c💰 NESTED PRICE DATA FOUND', 'background: #673AB7; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        price: calcVal.price,
        price_min: calcVal.price_min,
        price_med: calcVal.price_med,
        price_max: calcVal.price_max,
        price_avr: calcVal.price_avr
      });
    } else {
      console.error('%c❌ MISSING CALC VALUATION', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
        functionResponseStructure: JSON.stringify(rawData.functionResponse, null, 2)
      });
    }
  } else {
    console.error('%c❌ MISSING FUNCTION RESPONSE', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px', {
      topLevelKeys: Object.keys(rawData || {})
    });
  }

  // Check for valid data
  if (!rawData) {
    console.error('%c❌ NO VALID DATA FOUND', 'background: #F44336; color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px');
    return createEmptyValuation();
  }

  // Extract core vehicle data
  const vehicleData = extractVehicleData(rawData);
  
  // Extract price data using the dedicated utility
  const priceData = extractNestedPriceData(rawData);
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
    transmission: (rawData.transmission || 'manual') as TransmissionType,
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
