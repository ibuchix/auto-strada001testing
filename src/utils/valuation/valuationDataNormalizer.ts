/**
 * Changes made:
 * - 2025-04-26: Simplified normalization to pass through processed data
 * - 2025-04-26: Removed complex data extraction logic
 */

import { ValuationData, TransmissionType } from './valuationDataTypes';

export function normalizeValuationData(data: any): ValuationData {
  // If no data provided, return empty valuation
  if (!data) {
    console.error('No data provided to normalizer');
    return createEmptyValuation();
  }
  
  // Check if the API returned an error
  if (data.error) {
    console.error('API returned error:', data.error);
    return {
      ...createEmptyValuation(),
      vin: data.vin || '',
      mileage: data.mileage || 0,
      noData: true,
      error: data.error
    };
  }

  // Ensure transmission is a valid TransmissionType
  const transmission: TransmissionType = 
    (data.transmission === 'automatic' || data.transmission === 'manual') 
    ? data.transmission as TransmissionType 
    : 'manual';

  // Return normalized data structure
  return {
    vin: data.vin,
    make: data.make,
    model: data.model,
    year: data.year,
    mileage: data.mileage,
    transmission,
    valuation: data.valuation,
    reservePrice: data.reservePrice,
    averagePrice: data.averagePrice,
    basePrice: data.basePrice,
    noData: false
  };
}

function createEmptyValuation(): ValuationData {
  return {
    make: '',
    model: '',
    year: 0,
    vin: '',        // Include required vin property with empty default
    transmission: 'manual' as TransmissionType,
    mileage: 0,     // Include required mileage property with 0 default
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
}
