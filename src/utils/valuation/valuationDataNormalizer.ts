
/**
 * Changes made:
 * - 2025-04-26: Completely removed all extraction logic
 * - 2025-04-26: Simply verifies and passes through the data
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

  // Check if we have critical data (make, model, prices)
  if (!data.make || !data.model || !data.valuation) {
    console.error('Missing critical data in API response');
    return {
      ...createEmptyValuation(),
      vin: data.vin || '',
      mileage: data.mileage || 0,
      make: data.make || '',
      model: data.model || '',
      year: data.year || 0,
      noData: true,
      error: 'Incomplete vehicle data returned'
    };
  }

  // Ensure transmission is a valid TransmissionType
  const transmission: TransmissionType = 
    (data.transmission === 'automatic' || data.transmission === 'manual') 
    ? data.transmission as TransmissionType 
    : 'manual';

  // Return the data directly - minimal transformation
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
    vin: '',
    transmission: 'manual' as TransmissionType,
    mileage: 0,
    valuation: 0,
    reservePrice: 0,
    averagePrice: 0,
    basePrice: 0
  };
}
