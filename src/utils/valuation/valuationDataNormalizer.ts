
/**
 * Changes made:
 * - 2025-04-20: Enhanced price data extraction and normalization
 * - Added detailed debugging and validation
 * - Improved fallback value handling
 */

import { ValuationData, TransmissionType } from "./valuationDataTypes";
import { calculateReservePrice } from "./valuationCalculator";
import { debugVinApiResponse, debugValuationCalculation } from "../debugging/enhanced_vin_debugging";

export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  // Basic sanitization and type coercion for partial valuation data
  return {
    make: typeof data.make === 'string' ? data.make.trim() : '',
    model: typeof data.model === 'string' ? data.model.trim() : '',
    year: typeof data.year === 'number' && data.year > 0 ? data.year : 0,
    vin: typeof data.vin === 'string' ? data.vin.trim().toUpperCase() : '',
    transmission: (data.transmission as TransmissionType) || 'manual',
    mileage: typeof data.mileage === 'number' && data.mileage >= 0 ? data.mileage : 0
  };
}

export function normalizeValuationData(data: any): ValuationData {
  // Log incoming data for debugging
  debugVinApiResponse('raw_input', data);
  
  // Extract pricing information first
  const priceInfo = extractPriceInfo(data);
  
  const normalized: ValuationData = {
    make: data?.make || '',
    model: data?.model || '',
    year: data?.year || data?.productionYear || 0,
    vin: data?.vin || '',
    transmission: data?.transmission || 'manual',
    mileage: data?.mileage || 0,
    valuation: priceInfo.valuation,
    reservePrice: priceInfo.reservePrice,
    averagePrice: priceInfo.averagePrice,
    basePrice: priceInfo.basePrice,
    apiSource: data?.apiSource || 'default',
    error: data?.error,
    noData: data?.noData,
    isExisting: data?.isExisting
  };

  // Log normalized data for debugging
  debugVinApiResponse('normalized_output', normalized);
  
  return normalized;
}

function extractPriceInfo(data: any): {
  basePrice: number;
  reservePrice: number;
  valuation: number;
  averagePrice: number;
} {
  // Log incoming data structure
  console.log('Extracting price info from data:', {
    hasAutoIsoFields: !!(data.price_min || data.price_med),
    directPrices: {
      basePrice: data.basePrice,
      valuation: data.valuation,
      reservePrice: data.reservePrice
    }
  });

  // Initialize price values
  let basePrice = 0;
  let reservePrice = 0;
  let valuation = 0;
  let averagePrice = 0;

  // PRIORITY 1: Auto ISO API Format (Primary source)
  if (data.price_min !== undefined && data.price_med !== undefined) {
    const min = Number(data.price_min);
    const med = Number(data.price_med);
    
    if (min > 0 && med > 0) {
      basePrice = (min + med) / 2;
      console.log('AUTO ISO API: Calculated base price:', {
        price_min: min,
        price_med: med,
        basePrice
      });
      
      // Calculate reserve price using our tiered formula
      reservePrice = calculateReservePrice(basePrice);
      valuation = basePrice;
      averagePrice = med;
      
      return { basePrice, reservePrice, valuation, averagePrice };
    }
  }

  // PRIORITY 2: Direct API Values
  if (data.basePrice > 0 || data.valuation > 0) {
    basePrice = data.basePrice || data.valuation;
    reservePrice = data.reservePrice || calculateReservePrice(basePrice);
    valuation = data.valuation || basePrice;
    averagePrice = data.averagePrice || basePrice;
    
    console.log('Using direct API values:', {
      basePrice,
      reservePrice,
      valuation,
      averagePrice
    });
    
    return { basePrice, reservePrice, valuation, averagePrice };
  }

  // PRIORITY 3: Check primary nested locations
  const nestedData = data.data || data.apiResponse || data.valuationDetails;
  if (nestedData?.price_min && nestedData?.price_med) {
    const min = Number(nestedData.price_min);
    const med = Number(nestedData.price_med);
    
    if (min > 0 && med > 0) {
      basePrice = (min + med) / 2;
      reservePrice = calculateReservePrice(basePrice);
      valuation = basePrice;
      averagePrice = med;
      
      console.log('Using nested Auto ISO format:', {
        price_min: min,
        price_med: med,
        basePrice,
        reservePrice
      });
      
      return { basePrice, reservePrice, valuation, averagePrice };
    }
  }

  // No valid price data found
  console.error('No valid price data found in API response:', {
    dataKeys: Object.keys(data),
    vin: data.vin,
    make: data.make,
    model: data.model
  });

  return { basePrice: 0, reservePrice: 0, valuation: 0, averagePrice: 0 };
}
