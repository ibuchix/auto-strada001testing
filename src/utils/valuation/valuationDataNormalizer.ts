/**
 * Changes made:
 * - 2025-04-20: Enhanced data normalization with better price data extraction
 * - 2025-04-20: Added detailed logging and validation
 * - 2025-04-20: Fixed import paths and added sanitizePartialData function
 * - 2025-04-21: Updated to properly extract nested vehicle data from Auto ISO API response
 * - 2025-04-21: Fixed nested price extraction pattern to match API structure
 * - 2025-04-22: Enhanced data extraction to properly handle price data from API response
 * - 2025-04-21: ADDED STEP-BY-STEP LOGS FOR DEBUGGING DATA/PRICE EXTRACTION
 * - 2025-04-22: FIXED DIRECT RAW DATA LOGGING AND TYPE VALIDATION
 * - 2025-04-25: IMPROVED FALLBACK PRICE ESTIMATION WITH MAKE/MODEL BASED CALCULATIONS
 * - 2025-04-30: Updated to properly handle nested data structure
 */

import { extractPrice } from '../../utils/priceExtractor';
import { ValuationData, TransmissionType, calculateReservePrice, estimateBasePriceByModel } from './valuationDataTypes';

export function normalizeValuationData(rawData: any): ValuationData {
  // COMPREHENSIVE RAW DATA LOGGING
  console.log('[VAL-NORM] INPUT RAW valuation data:', JSON.stringify(rawData));
  console.log('[VAL-NORM] Raw data structure:', {
    hasData: !!rawData,
    isObject: typeof rawData === 'object',
    hasNestedData: !!rawData?.data,
    topLevelKeys: rawData ? Object.keys(rawData) : []
  });

  // Extract data from nested structure if present
  const data = rawData?.data || rawData;
  
  if (!data) {
    console.warn('[VAL-NORM] No valid data found in response');
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
      basePrice: 0,
      error: 'No valid data found'
    };
  }

  // Extract core vehicle data with logging
  const make = data.make || '';
  const model = data.model || '';
  const year = data.year || 0;
  const vin = data.vin || '';
  const mileage = data.mileage || 0;

  console.log('[VAL-NORM] EXTRACTED VEHICLE DATA:', {
    make,
    model,
    year,
    vin,
    mileage,
    transmission: rawData.transmission || data.transmission
  });

  // Extract and normalize price data
  const priceFields = {
    valuation: data.valuation || 0,
    price: data.price || 0,
    reservePrice: data.reservePrice || 0,
    averagePrice: data.averagePrice || 0,
    basePrice: data.basePrice || 0
  };

  console.log('[VAL-NORM] EXTRACTED PRICE FIELDS:', priceFields);

  // Calculate base price and reserve price
  let basePrice = priceFields.valuation || priceFields.price || priceFields.basePrice || 0;
  let reservePrice = priceFields.reservePrice;

  // If we have vehicle details but no price, estimate it
  if (basePrice === 0 && make && model && year > 0) {
    console.log('[VAL-NORM] Estimating price based on vehicle details:', { make, model, year });
    basePrice = estimateBasePriceByModel(make, model, year);
    reservePrice = calculateReservePrice(basePrice);
  }

  const normalized: ValuationData = {
    make,
    model,
    year,
    vin,
    transmission: (rawData.transmission || data.transmission || 'manual') as TransmissionType,
    mileage,
    valuation: basePrice,
    reservePrice: reservePrice || calculateReservePrice(basePrice),
    averagePrice: priceFields.averagePrice || basePrice,
    basePrice,
    apiSource: data.apiSource,
    valuationDate: data.valuationDate || new Date().toISOString(),
    usingFallbackEstimation: basePrice === 0,
    error: data.error,
    noData: data.noData,
    isExisting: data.isExisting
  };

  console.log('[VAL-NORM] NORMALIZED OUTPUT:', normalized);

  return normalized;
}

/**
 * Helper function to normalize transmission values
 */
function normalizeTransmission(transmission: any): TransmissionType {
  if (typeof transmission === 'string') {
    const normalized = transmission.toLowerCase();
    return normalized === 'automatic' ? 'automatic' : 'manual';
  }
  return 'manual'; // Default to manual if not specified
}

/**
 * Sanitizes partial valuation data for recovery purposes
 */
export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  if (!data) return {};
  
  return {
    make: data.make || '',
    model: data.model || '',
    year: data.year || 0,
    vin: data.vin || '',
    transmission: data.transmission || 'manual',
    mileage: data.mileage || 0,
    valuation: data.valuation || 0,
    reservePrice: data.reservePrice || 0,
    averagePrice: data.averagePrice || 0,
    basePrice: data.basePrice || 0,
    usingFallbackEstimation: data.usingFallbackEstimation,
    estimationMethod: data.estimationMethod,
    apiSource: data.apiSource,
    error: data.error,
    noData: data.noData,
    isExisting: data.isExisting
  };
}
