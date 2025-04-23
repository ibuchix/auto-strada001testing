
/**
 * Vehicle data extraction utility
 * Created: 2025-04-23
 * Updated: 2025-04-23 - Enhanced to handle nested API response structure
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

/**
 * Extracts vehicle data from API response, prioritizing nested structure
 * @param rawData API response data
 * @returns Object with vehicle details
 */
export function extractVehicleData(rawData: any) {
  // Try to get data from nested structure first
  const userParams = rawData?.functionResponse?.userParams;
  
  // Log the available data for debugging
  console.log('Extracting vehicle data from:', {
    hasUserParams: !!userParams,
    userParamsKeys: userParams ? Object.keys(userParams) : [],
    rootKeys: Object.keys(rawData || {})
  });
  
  // For make, model, year - first check userParams if available (most accurate source)
  const make = userParams?.make || rawData.make || '';
  const model = userParams?.model || rawData.model || '';
  const year = Number(userParams?.year || rawData.year || 0);
  const transmission = userParams?.gearbox || rawData.transmission || rawData.gearbox || 'manual';
  const vin = rawData.vin || '';
  const mileage = Number(userParams?.odometer || rawData.mileage || 0);

  // Log what we found for debugging
  console.log('Extracted vehicle data:', { make, model, year, transmission, mileage });
  
  return {
    make,
    model,
    year,
    vin,
    mileage,
    transmission
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
