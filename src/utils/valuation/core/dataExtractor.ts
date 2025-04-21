
/**
 * Changes made:
 * - 2025-04-21: Created utility for extracting data from API response
 * - 2025-04-21: Updated RawValuationData interface to include vin at all levels
 */

import { ValuationData } from '../valuationDataTypes';

export interface RawValuationData {
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
}

export function extractVehicleData(rawData: RawValuationData) {
  const data = rawData?.data || rawData;
  
  console.log('[DATA-EXTRACTOR] Extracting from:', {
    hasNestedData: !!rawData?.data,
    sourceKeys: Object.keys(data)
  });
  
  return {
    make: data.make || '',
    model: data.model || '',
    year: data.year || 0,
    vin: data.vin || '',
    mileage: data.mileage || 0,
    transmission: rawData.transmission || 'manual'
  };
}

export function extractPriceData(rawData: RawValuationData) {
  const data = rawData?.data || rawData;
  
  console.log('[DATA-EXTRACTOR] Extracting price data from:', {
    dataSource: rawData?.data ? 'nested' : 'root',
    availablePriceFields: Object.keys(data).filter(key => 
      ['price', 'valuation', 'reservePrice', 'averagePrice'].includes(key)
    )
  });
  
  return {
    price: data.price || 0,
    valuation: data.valuation || 0,
    reservePrice: data.reservePrice || 0,
    averagePrice: data.averagePrice || 0
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
