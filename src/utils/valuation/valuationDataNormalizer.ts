
/**
 * Changes made:
 * - 2025-04-26: Enhanced data extraction and validation
 * - 2025-04-26: Added multiple data extraction paths
 * - 2025-04-26: Improved error handling and logging
 * - 2025-04-26: Fixed direct parsing of the rawApiResponse
 */

import { ValuationData, TransmissionType } from './valuationDataTypes';
import { calculateReservePrice } from '@/utils/priceUtils';

export function normalizeValuationData(data: any): ValuationData {
  console.log('Raw valuation data:', data);
  
  if (!data) {
    console.error('No data provided to normalizer');
    return createEmptyValuation();
  }

  try {
    // First try to use the pre-processed data from the edge function
    if (data.make && data.model) {
      console.log('Using pre-processed data from edge function:', {
        make: data.make,
        model: data.model,
        year: data.year,
        prices: {
          base: data.basePrice,
          reserve: data.reservePrice,
          average: data.averagePrice
        }
      });

      return {
        make: data.make,
        model: data.model,
        year: data.year || new Date().getFullYear(),
        vin: data.vin || '',
        transmission: (data.transmission || 'manual') as TransmissionType,
        mileage: Number(data.mileage) || 0,
        valuation: Number(data.valuation) || Number(data.basePrice) || 0,
        reservePrice: Number(data.reservePrice) || 0,
        averagePrice: Number(data.averagePrice) || Number(data.price_med) || 0,
        basePrice: Number(data.basePrice) || 0,
        noData: false
      };
    }

    // If we have rawApiResponse, try to parse and extract data from it
    console.log('Attempting to extract data from rawApiResponse');
    if (data.rawApiResponse) {
      const rawResponse = typeof data.rawApiResponse === 'string' 
        ? JSON.parse(data.rawApiResponse) 
        : data.rawApiResponse;

      if (rawResponse?.functionResponse) {
        const userParams = rawResponse.functionResponse.userParams;
        let calcValuation;
        
        if (rawResponse.functionResponse.valuation?.calcValuation) {
          calcValuation = rawResponse.functionResponse.valuation.calcValuation;
        }

        console.log('Extracted data from rawApiResponse:', {
          userParams,
          calcValuation
        });

        if (userParams && calcValuation) {
          const priceMin = Number(calcValuation.price_min) || 0;
          const priceMed = Number(calcValuation.price_med) || 0;
          const basePrice = (priceMin + priceMed) / 2;
          const reservePrice = calculateReservePrice(basePrice);

          console.log('Calculated prices:', {
            priceMin,
            priceMed,
            basePrice,
            reservePrice
          });

          return {
            make: userParams.make || '',
            model: userParams.model || '',
            year: userParams.year ? Number(userParams.year) : new Date().getFullYear(),
            vin: data.vin || '',
            transmission: (data.transmission || 'manual') as TransmissionType,
            mileage: Number(data.mileage) || 0,
            valuation: basePrice,
            reservePrice: reservePrice,
            averagePrice: priceMed,
            basePrice: basePrice,
            noData: false
          };
        }
      }
    }

    console.warn('Could not extract valid valuation data');
    return {
      ...createEmptyValuation(),
      vin: data.vin || '',
      mileage: Number(data.mileage) || 0,
      noData: true,
      error: 'Could not extract vehicle data'
    };

  } catch (error) {
    console.error('Error normalizing valuation data:', error);
    return {
      ...createEmptyValuation(),
      vin: data.vin || '',
      mileage: Number(data.mileage) || 0,
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
