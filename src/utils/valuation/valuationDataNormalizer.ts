
/**
 * Changes made:
 * - 2025-04-20: Enhanced data normalization with better price data extraction
 * - 2025-04-20: Added detailed logging and validation
 * - 2025-04-20: Fixed import paths and added sanitizePartialData function
 * - 2025-04-21: Updated to properly extract nested vehicle data from Auto ISO API response
 * - 2025-04-21: Fixed nested price extraction pattern to match API structure
 * - 2025-04-22: Enhanced data transformation to correctly preserve pricing information
 * - 2025-04-22: Fixed edge function response handling for proper reserve price extraction
 */

import { extractPrice } from '../../utils/priceExtractor';
import { ValuationData, TransmissionType, calculateReservePrice } from './valuationDataTypes';

export function normalizeValuationData(data: any): ValuationData {
  // Log the raw data for debugging
  console.log('Normalizing valuation data:', {
    hasData: !!data,
    dataKeys: data ? Object.keys(data) : [],
    timestamp: new Date().toISOString(),
    hasNestedFunctionResponse: !!data?.functionResponse
  });

  // Enhanced extraction with more specific paths
  const functionResponse = data?.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Extract base price with improved path awareness
  const basePrice = extractBasePrice(data, calcValuation);
  
  // Extract reserve price with fallbacks
  const reservePrice = extractReservePrice(data, basePrice);
  
  // Extract make, model, year from the proper nested location
  const make = userParams.make || data?.make || '';
  const model = userParams.model || data?.model || '';
  const year = userParams.year || data?.year || data?.productionYear || 0;
  
  // Normalize the transmission type
  const gearbox = userParams.gearbox || data?.transmission || data?.gearbox || '';
  const transmission = normalizeTransmission(gearbox);

  // Get mileage from the proper nested location or from the root
  const mileage = userParams.odometer || data?.mileage || 0;

  // Extract API-specific price fields with fallbacks
  const priceMin = calcValuation.price_min || data?.price_min || 0;
  const priceMed = calcValuation.price_med || data?.price_med || data?.averagePrice || 0;
  const averagePrice = data?.averagePrice || priceMed || basePrice;

  // Log the extracted price data for debugging
  console.log('Extracted pricing data:', {
    basePrice,
    reservePrice,
    priceMin,
    priceMed,
    averagePrice,
    fromCalcValuation: !!calcValuation.price_med,
    fromDirectPrice: !!data?.price,
    fromDirectReservePrice: !!data?.reservePrice
  });

  const normalized: ValuationData = {
    make: make,
    model: model,
    year: year,
    vin: data?.vin || '',
    transmission,
    mileage: typeof mileage === 'number' ? mileage : parseInt(mileage) || 0,
    valuation: data?.valuation || basePrice || 0,
    reservePrice: reservePrice || 0,
    averagePrice: averagePrice,
    basePrice: basePrice,
    
    // API metadata
    apiSource: data?.apiSource || 'default',
    valuationDate: data?.valuationDate || new Date().toISOString(),
    
    // Status flags
    error: data?.error,
    noData: data?.noData,
    isExisting: data?.isExisting
  };

  // Log the normalized result
  console.log('Normalized valuation data:', {
    make: normalized.make,
    model: normalized.model,
    year: normalized.year,
    basePrice: normalized.basePrice,
    reservePrice: normalized.reservePrice,
    averagePrice: normalized.averagePrice,
    hasError: !!normalized.error
  });

  return normalized;
}

/**
 * Helper function to extract base price from different data structures
 */
function extractBasePrice(data: any, calcValuation: any): number {
  // Check directly for basePrice field (added by edge function)
  if (data.basePrice > 0) {
    return Number(data.basePrice);
  }
  
  // Then try to get price from calcValuation (most reliable)
  if (calcValuation.price_min > 0 && calcValuation.price_med > 0) {
    const priceMin = Number(calcValuation.price_min);
    const priceMed = Number(calcValuation.price_med);
    return (priceMin + priceMed) / 2;
  }
  
  // Then try direct price in calcValuation
  if (calcValuation.price > 0) {
    return Number(calcValuation.price);
  }
  
  // Fall back to price_min and price_med at root level
  if (data.price_min > 0 && data.price_med > 0) {
    return (Number(data.price_min) + Number(data.price_med)) / 2;
  }
  
  // Use extractPrice utility as final fallback
  return extractPrice(data);
}

/**
 * Helper function to extract reserve price from different data structures
 */
function extractReservePrice(data: any, basePrice: number): number {
  // First check if reservePrice is directly provided (preferred)
  if (data.reservePrice > 0) {
    return Number(data.reservePrice);
  }
  
  // If we have a base price but no reserve price, calculate it
  if (basePrice > 0) {
    return calculateReservePrice(basePrice);
  }
  
  return 0;
}

function normalizeTransmission(transmission: any): TransmissionType {
  if (typeof transmission === 'string') {
    const normalized = transmission.toLowerCase();
    return normalized === 'automatic' ? 'automatic' : 'manual';
  }
  return 'manual'; // Default to manual if not specified
}

/**
 * Sanitizes partial valuation data for recovery purposes
 * Added to support the dataRecovery utility
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
    error: data.error,
    noData: data.noData,
    isExisting: data.isExisting
  };
}
