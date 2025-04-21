/**
 * Changes made:
 * - 2025-04-20: Enhanced data normalization with better price data extraction
 * - 2025-04-20: Added detailed logging and validation
 * - 2025-04-20: Fixed import paths and added sanitizePartialData function
 * - 2025-04-21: Updated to properly extract nested vehicle data from Auto ISO API response
 * - 2025-04-21: Fixed nested price extraction pattern to match API structure
 * - 2025-04-22: Enhanced data extraction to properly handle price data from API response
 * - 2025-04-21: ADDED STEP-BY-STEP LOGS FOR DEBUGGING DATA/PRICE EXTRACTION
 */

import { extractPrice } from '../../utils/priceExtractor';
import { ValuationData, TransmissionType, calculateReservePrice } from './valuationDataTypes';

export function normalizeValuationData(data: any): ValuationData {
  // Log the raw data for debugging
  console.log('[VAL-NORM] INPUT RAW valuation data:', JSON.stringify(data, null, 2));

  // Enhanced extraction with more specific paths
  const functionResponse = data?.functionResponse || {};
  const userParams = functionResponse.userParams || {};
  const calcValuation = functionResponse.valuation?.calcValuation || {};
  
  // Extract make, model, year from the proper nested location
  const make = userParams.make || data?.make || '';
  const model = userParams.model || data?.model || '';
  const year = userParams.year || data?.year || data?.productionYear || 0;
  
  // Normalize the transmission type
  const gearbox = userParams.gearbox || data?.transmission || data?.gearbox || '';
  const transmission = normalizeTransmission(gearbox);

  // Get mileage from the proper nested location or from the root
  const mileage = userParams.odometer || data?.mileage || 0;

  // Extract API-specific price fields with improved fallbacks
  const priceMin = calcValuation.price_min || data?.price_min || 0;
  const priceMed = calcValuation.price_med || data?.price_med || data?.averagePrice || 0;
  
  // Explicit logs for price extraction
  console.log('[VAL-NORM] EXTRACTED make/model/year:', { make, model, year });
  console.log('[VAL-NORM] EXTRACTED GEARBOX DATA:', { gearbox, transmission });
  console.log('[VAL-NORM] EXTRACTED MILEAGE:', { mileage });
  console.log('[VAL-NORM] EXTRACTED priceMin/priceMed:', { priceMin, priceMed });

  // Direct price/valuation
  let valuation = data?.valuation;
  if (!valuation || valuation <= 0) {
    valuation = data?.price || priceMed || 0;
    if (!valuation) console.warn('[VAL-NORM] Unable to find valuation in fields, using fallback...');
  }
  
  // Calculate base price with improved fallbacks
  let basePrice = 0;
  if (priceMin > 0 && priceMed > 0) {
    basePrice = (priceMin + priceMed) / 2;
    console.log('[VAL-NORM] basePrice calculated from priceMin & priceMed:', { priceMin, priceMed, basePrice });
  } else if (valuation > 0) {
    basePrice = valuation;
    console.warn('[VAL-NORM] basePrice set from valuation (no min/med):', { valuation, basePrice });
  } else if (data?.price > 0) {
    basePrice = data.price;
    console.warn('[VAL-NORM] basePrice set from data.price:', { basePrice });
  } else {
    // Last resort fallback
    console.warn('[VAL-NORM][WARN] No valid price found (should not happen), using fallback 50000');
    basePrice = 50000; // Default fallback value
  }

  // Extract or calculate reserve price
  let reservePrice = data?.reservePrice;
  if (!reservePrice || reservePrice <= 0) {
    reservePrice = calculateReservePrice(basePrice);
    console.warn('[VAL-NORM] Calculated reservePrice:', { reservePrice, basePrice });
  }
  
  // Use average price with fallbacks
  const averagePrice = data?.averagePrice || priceMed || basePrice;

  // Log the extracted price data for debugging
  console.log('[VAL-NORM] PRICING SUMMARY:', {
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
    make,
    model,
    year,
    vin: data?.vin || '',
    transmission,
    mileage: typeof mileage === 'number' ? mileage : parseInt(String(mileage)) || 0,
    valuation: valuation || basePrice,
    reservePrice,
    averagePrice,
    basePrice,
    
    // API metadata
    apiSource: data?.apiSource || 'default',
    valuationDate: data?.valuationDate || new Date().toISOString(),
    
    // Status flags
    error: data?.error,
    noData: data?.noData,
    isExisting: data?.isExisting
  };

  // Log the normalized result
  console.log('[VAL-NORM] OUTPUT normalized valuation data:', normalized);

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
    error: data.error,
    noData: data.noData,
    isExisting: data.isExisting
  };
}
