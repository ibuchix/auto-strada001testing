
/**
 * Data extraction utilities
 * Created: 2025-04-19
 */

import { ValuationData } from './types';
import { normalizeValuationData } from './normalizer';

/**
 * Extract valuation data from API response
 * @param apiResponse Response from external valuation API
 * @returns Normalized ValuationData
 */
export function extractValuationFromApiResponse(apiResponse: any): ValuationData {
  // Check if data is in expected format
  if (!apiResponse || !apiResponse.data) {
    throw new Error('Invalid API response format');
  }
  
  // Extract data from API response
  const data = apiResponse.data;
  
  // Handle different API response formats
  if (data.price_min !== undefined && data.price_med !== undefined) {
    // Calculate base price (average of min and median)
    data.basePrice = (Number(data.price_min) + Number(data.price_med)) / 2;
  }
  
  // Normalize to consistent format
  return normalizeValuationData(data);
}

/**
 * Extract valuation data from database record
 * @param dbRecord Database record containing valuation data
 * @param valuationDataField Field name containing valuation data
 * @returns Normalized ValuationData
 */
export function extractValuationFromDbRecord(
  dbRecord: any, 
  valuationDataField: string = 'valuation_data'
): ValuationData {
  if (!dbRecord) {
    throw new Error('Invalid database record');
  }
  
  // Get valuation data from field
  const valuationData = dbRecord[valuationDataField];
  
  if (!valuationData) {
    throw new Error(`No valuation data found in field '${valuationDataField}'`);
  }
  
  // Normalize the data
  return normalizeValuationData(valuationData);
}

/**
 * Create empty valuation data structure
 * @param vin Optional VIN to include
 * @returns Empty ValuationData object
 */
export function createEmptyValuationData(vin?: string): ValuationData {
  return {
    vin: vin || '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    mileage: 0,
    transmission: undefined,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0,
    minPrice: 0,
    maxPrice: 0,
    currency: 'PLN'
  };
}
