
/**
 * Changes made:
 * - 2025-04-26: Completely refactored to handle raw API response
 * - 2025-04-26: Fixed TypeScript error with price_med property
 * - 2025-04-28: Enhanced data extraction from edge function response
 * - 2025-04-30: Fixed direct extraction of data from edge function response
 */

import { ValuationData, TransmissionType } from './valuationDataTypes';
import { calculateReservePrice } from '@/utils/priceUtils';

export function normalizeValuationData(data: any): ValuationData {
  // Check if we have any data at all
  if (!data) {
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
    console.log('Normalizing valuation data, data keys:', Object.keys(data));
    
    // DIRECTLY USE VALUES FROM THE EDGE FUNCTION
    // The edge function now sends properly extracted and formatted values
    // No need for complex parsing - just use what the edge function provides
    if (data.make && data.model) {
      console.log('Direct fields from edge function found! Using them:', {
        make: data.make,
        model: data.model,
        basePrice: data.basePrice,
        reservePrice: data.reservePrice
      });
      
      return {
        make: data.make || '',
        model: data.model || '',
        year: data.year || 0,
        vin: data.originalRequestParams?.vin || data.vin || '',
        transmission: (data.originalRequestParams?.gearbox || data.gearbox || 'manual') as TransmissionType,
        mileage: data.originalRequestParams?.mileage || data.mileage || 0,
        valuation: data.valuation || data.basePrice || 0,
        reservePrice: data.reservePrice || 0,
        averagePrice: data.averagePrice || data.price_med || 0,
        basePrice: data.basePrice || 0,
        noData: false
      };
    }
    
    // If we don't have direct fields, try to parse from rawApiResponse
    console.log('No direct fields found, trying to extract from rawApiResponse');
    if (data.rawApiResponse) {
      let rawResponse;
      try {
        // Handle case where rawApiResponse might be a string
        rawResponse = typeof data.rawApiResponse === 'string' 
          ? JSON.parse(data.rawApiResponse) 
          : data.rawApiResponse;
        
        console.log('Raw API Response parsed successfully');
      } catch (e) {
        console.error('Failed to parse raw API response:', e);
        return createEmptyValuation();
      }
      
      if (rawResponse?.functionResponse?.userParams && rawResponse?.functionResponse?.valuation?.calcValuation) {
        const userParams = rawResponse.functionResponse.userParams;
        const calcValuation = rawResponse.functionResponse.valuation.calcValuation;
        
        console.log('Found valid data structure in rawApiResponse:', {
          userParams: {
            make: userParams.make,
            model: userParams.model,
            year: userParams.year
          },
          calcValuation: {
            price_min: calcValuation.price_min,
            price_med: calcValuation.price_med
          }
        });
        
        // Calculate base price
        const priceMin = Number(calcValuation.price_min) || 0;
        const priceMed = Number(calcValuation.price_med) || 0;
        const basePrice = (priceMin + priceMed) / 2;
        const reservePrice = calculateReservePrice(basePrice);
        
        console.log('Calculated prices from raw data:', {
          basePrice,
          reservePrice
        });
        
        return {
          make: userParams.make || '',
          model: userParams.model || '',
          year: userParams.year || new Date().getFullYear(),
          vin: data.originalRequestParams?.vin || data.vin || '',
          transmission: (data.originalRequestParams?.gearbox || data.gearbox || 'manual') as TransmissionType,
          mileage: data.originalRequestParams?.mileage || data.mileage || 0,
          valuation: basePrice,
          reservePrice: reservePrice,
          averagePrice: priceMed,
          basePrice: basePrice,
          noData: false
        };
      }
    }
    
    console.warn('Could not find valid valuation data structure');
    return {
      ...createEmptyValuation(),
      vin: data.originalRequestParams?.vin || data.vin || '',
      mileage: data.originalRequestParams?.mileage || data.mileage || 0,
      noData: true,
      error: 'Could not extract vehicle data'
    };
  } catch (error) {
    console.error('Error normalizing valuation data:', error);
    return {
      ...createEmptyValuation(),
      vin: data.originalRequestParams?.vin || data.vin || '',
      mileage: data.originalRequestParams?.mileage || data.mileage || 0,
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
