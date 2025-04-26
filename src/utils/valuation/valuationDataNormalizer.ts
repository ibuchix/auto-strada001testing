
/**
 * Changes made:
 * - 2025-04-26: Completely refactored to handle raw API response
 */

import { ValuationData, TransmissionType } from './valuationDataTypes';
import { calculateReservePrice } from '@/utils/priceUtils';

export function normalizeValuationData(data: any): ValuationData {
  // Check if we have the raw API response
  if (!data || (!data.rawApiResponse && !data.error)) {
    console.error('No data provided to normalizer');
    return createEmptyValuation();
  }
  
  // If there's an error, return empty valuation with error
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

  try {
    // Extract the function response from raw API data
    let rawResponse;
    try {
      // Handle case where rawApiResponse might be a string
      rawResponse = typeof data.rawApiResponse === 'string' 
        ? JSON.parse(data.rawApiResponse) 
        : data.rawApiResponse;
    } catch (e) {
      console.error('Failed to parse raw API response:', e);
      return createEmptyValuation();
    }

    // Extract user params and valuation data
    const userParams = rawResponse?.functionResponse?.userParams;
    const valuationData = rawResponse?.functionResponse?.valuation?.calcValuation;

    if (!userParams || !valuationData) {
      console.error('Missing critical data in API response');
      return {
        ...createEmptyValuation(),
        noData: true,
        error: 'Incomplete data received from API'
      };
    }

    // Calculate the base price as average of min and median prices
    const basePrice = Math.round((valuationData.price_min + valuationData.price_med) / 2);
    
    // Calculate reserve price based on the base price
    const reservePrice = calculateReservePrice(basePrice);

    return {
      make: userParams.make || '',
      model: userParams.model || '',
      year: userParams.year || 0,
      vin: data.originalRequestParams?.vin || '',
      transmission: (data.originalRequestParams?.gearbox || 'manual') as TransmissionType,
      mileage: data.originalRequestParams?.mileage || 0,
      valuation: valuationData.price || basePrice,
      reservePrice,
      averagePrice: valuationData.price_avr || valuationData.price_med,
      basePrice,
      noData: false
    };
  } catch (error) {
    console.error('Error normalizing valuation data:', error);
    return {
      ...createEmptyValuation(),
      vin: data.originalRequestParams?.vin || '',
      mileage: data.originalRequestParams?.mileage || 0,
      noData: true,
      error: 'Failed to process valuation data'
    };
  }
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
    basePrice: 0,
    noData: true
  };
}
