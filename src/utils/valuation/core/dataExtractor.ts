
/**
 * Vehicle data extraction utility
 * Created: 2025-04-23
 * Core data extraction functions for valuation data
 */

import { ValuationData } from '../valuationDataTypes';

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

export function extractVehicleData(rawData: any) {
  // Try to get data from nested structure first, then fallback to root
  const sourceData = rawData?.data || rawData;
  
  // For make, model, year - first check functionResponse if available
  const make = rawData?.functionResponse?.userParams?.make || 
               sourceData.make || 
               '';
               
  const model = rawData?.functionResponse?.userParams?.model || 
                sourceData.model || 
                '';
                
  const year = rawData?.functionResponse?.userParams?.year || 
               sourceData.year || 
               0;
  
  return {
    make,
    model,
    year,
    vin: sourceData.vin || '',
    mileage: sourceData.mileage || 0,
    transmission: rawData.transmission || 'manual'
  };
}

export function extractPriceData(rawData: any) {
  const { extractNestedPriceData, calculateBasePriceFromNested } = 
    require('@/utils/extraction/pricePathExtractor');
  
  // Extract nested price data
  const priceData = extractNestedPriceData(rawData);
  
  // Calculate base price
  const basePrice = calculateBasePriceFromNested(priceData);
  
  return {
    basePrice,
    reservePrice: rawData.reservePrice || 0,
    averagePrice: priceData.price_med || 0,
    valuation: basePrice
  };
}
