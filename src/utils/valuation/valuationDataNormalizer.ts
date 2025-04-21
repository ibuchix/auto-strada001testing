
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
 */

import { extractPrice } from '../../utils/priceExtractor';
import { ValuationData, TransmissionType, calculateReservePrice } from './valuationDataTypes';

export function normalizeValuationData(data: any): ValuationData {
  // COMPREHENSIVE RAW DATA LOGGING
  console.log('[VAL-NORM] INPUT RAW valuation data:', JSON.stringify(data));
  
  // Log the entire raw structure for easier debugging
  console.log('[VAL-NORM] Raw data keys:', Object.keys(data));
  
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

  console.log('[VAL-NORM] EXTRACTED VEHICLE DATA:', { make, model, year, transmission, mileage });
  
  // DIRECT PRICE DEBUGGING - Log all possible price-related fields
  const allPriceFields: Record<string, any> = {};
  const findPriceFields = (obj: any, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (
        key.toLowerCase().includes('price') || 
        key.toLowerCase().includes('value') ||
        key.toLowerCase().includes('valuation')
      ) {
        allPriceFields[fullKey] = value;
      }
      
      // Recursively check nested objects, but not arrays
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        findPriceFields(value, fullKey);
      }
    });
  };
  
  findPriceFields(data);
  console.log('[VAL-NORM] ALL AVAILABLE PRICE FIELDS:', allPriceFields);

  // Extract API-specific price fields with improved fallbacks
  // Log each attempt to extract price data
  let priceMin = 0;
  let priceMed = 0;
  
  // Try direct extractions from calcValuation (primary source)
  console.log('[VAL-NORM] Checking calcValuation for price_min:', calcValuation?.price_min);
  console.log('[VAL-NORM] Checking calcValuation for price_med:', calcValuation?.price_med);
  
  if (calcValuation?.price_min !== undefined) {
    priceMin = Number(calcValuation.price_min);
  }
  
  if (calcValuation?.price_med !== undefined) {
    priceMed = Number(calcValuation.price_med);
  }
  
  // If not found, try root data
  if (priceMin <= 0) {
    console.log('[VAL-NORM] Checking root for price_min:', data?.price_min);
    if (data?.price_min !== undefined) {
      priceMin = Number(data.price_min);
    }
  }
  
  if (priceMed <= 0) {
    console.log('[VAL-NORM] Checking root for price_med:', data?.price_med);
    if (data?.price_med !== undefined) {
      priceMed = Number(data.price_med);
    }
  }
  
  console.log('[VAL-NORM] EXTRACTED PRICE DATA:', { priceMin, priceMed });

  // Direct price/valuation
  let valuation = data?.valuation;
  console.log('[VAL-NORM] Direct valuation field:', valuation);
  
  if (!valuation || valuation <= 0) {
    valuation = data?.price || priceMed || 0;
    if (!valuation) {
      console.warn('[VAL-NORM] Unable to find valuation in fields, using fallback...');
    }
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
  } else if (data?.valuation > 0) {
    basePrice = data.valuation;
    console.warn('[VAL-NORM] basePrice set from data.valuation:', { basePrice });
  } else if (Object.values(allPriceFields).some(value => typeof value === 'number' && value > 0)) {
    // Find the first valid price in our collected price fields
    const validPrices = Object.entries(allPriceFields)
      .filter(([_, value]) => typeof value === 'number' && value > 0)
      .map(([key, value]) => ({ key, value }));
      
    if (validPrices.length > 0) {
      basePrice = validPrices[0].value;
      console.warn('[VAL-NORM] basePrice set from alternative field:', validPrices[0].key, basePrice);
    }
  } else {
    // Last resort fallback
    console.warn('[VAL-NORM][WARN] No valid price found (should not happen), using fallback 50000');
    basePrice = 50000; // Default fallback value
  }

  // Extract or calculate reserve price with thorough validation
  let reservePrice = data?.reservePrice;
  console.log('[VAL-NORM] Direct reservePrice field:', reservePrice);
  
  // Make sure reservePrice is actually a number
  if (typeof reservePrice !== 'number' || isNaN(reservePrice) || reservePrice <= 0) {
    try {
      reservePrice = calculateReservePrice(basePrice);
      console.warn('[VAL-NORM] Calculated reservePrice:', { reservePrice, basePrice });
    } catch (error) {
      console.error('[VAL-NORM] Error calculating reserve price:', error);
      // Safe fallback - set reserve price to 70% of base price
      reservePrice = Math.round(basePrice * 0.7);
      console.warn('[VAL-NORM] Using fallback reserve price (70%):', reservePrice);
    }
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

  // Final validation check to ensure we have mandatory fields
  if (!normalized.make || !normalized.model || normalized.year <= 0) {
    console.warn('[VAL-NORM] WARN: Missing critical vehicle data:', {
      hasMake: !!normalized.make, 
      hasModel: !!normalized.model, 
      hasYear: normalized.year > 0
    });
  }

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
