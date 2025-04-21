/**
 * Changes made:
 * - 2025-04-21: Created utility for extracting data from API response
 * - 2025-04-21: Updated RawValuationData interface to include vin at all levels
 * - 2025-04-21: Enhanced price data extraction to handle nested API response
 */

import { ValuationData } from '../valuationDataTypes';

export interface RawValuationData {
  success?: boolean;
  data?: {
    make?: string;
    model?: string;
    year?: number;
    vin?: string;
    mileage?: number;
    price?: number;
    valuation?: number;
    reservePrice?: number;
    averagePrice?: number;
    price_min?: number;
    price_med?: number;
  };
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  transmission?: string;
  mileage?: number;
  price?: number;
  valuation?: number;
  reservePrice?: number;
  averagePrice?: number;
  price_min?: number;
  price_med?: number;
  basePrice?: number;
}

export function extractVehicleData(rawData: RawValuationData) {
  // Try to get data from nested structure first, then fallback to root
  const sourceData = rawData?.data || rawData;
  
  console.log('[DATA-EXTRACTOR] Using data source:', {
    isNested: !!rawData?.data,
    dataKeys: Object.keys(sourceData)
  });
  
  return {
    make: sourceData.make || '',
    model: sourceData.model || '',
    year: sourceData.year || 0,
    vin: sourceData.vin || '',
    mileage: sourceData.mileage || 0,
    transmission: rawData.transmission || 'manual'
  };
}

export function extractPriceData(rawData: RawValuationData) {
  // Try to get data from nested structure first, then fallback to root
  const sourceData = rawData?.data || rawData;
  
  // Log available price fields for debugging
  console.log('[DATA-EXTRACTOR] Available price fields:', {
    fromSource: Object.keys(sourceData).filter(key => 
      ['price', 'valuation', 'reservePrice', 'averagePrice', 'price_min', 'price_med', 'basePrice'].includes(key)
    ),
    values: {
      price: sourceData.price,
      valuation: sourceData.valuation,
      reservePrice: sourceData.reservePrice,
      averagePrice: sourceData.averagePrice,
      price_min: sourceData.price_min,
      price_med: sourceData.price_med,
      basePrice: sourceData.basePrice
    }
  });

  // Calculate base price from price_min and price_med if available
  let basePrice = 0;
  if (sourceData.price_min && sourceData.price_med) {
    basePrice = (sourceData.price_min + sourceData.price_med) / 2;
    console.log('[DATA-EXTRACTOR] Calculated base price from min/med:', {
      price_min: sourceData.price_min,
      price_med: sourceData.price_med,
      basePrice
    });
  } else {
    // Try other price fields
    basePrice = sourceData.basePrice || 
                sourceData.valuation || 
                sourceData.price || 
                sourceData.averagePrice || 
                0;
  }

  return {
    price: sourceData.price || 0,
    valuation: sourceData.valuation || basePrice,
    reservePrice: sourceData.reservePrice || 0,
    averagePrice: sourceData.averagePrice || basePrice,
    basePrice: basePrice
  };
}

// Add the sanitization utility that was previously in valuationDataNormalizer
export function sanitizePartialData(data: Partial<ValuationData>): Partial<ValuationData> {
  return {
    make: data.make?.trim() || undefined,
    model: data.model?.trim() || undefined,
    year: data.year || undefined,
    vin: data.vin?.trim() || undefined,
    transmission: data.transmission || undefined,
    mileage: data.mileage || undefined,
    valuation: data.valuation || undefined,
    reservePrice: data.reservePrice || undefined,
    averagePrice: data.averagePrice || undefined,
    basePrice: data.basePrice || undefined
  };
}
