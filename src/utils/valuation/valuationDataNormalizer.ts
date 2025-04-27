
/**
 * Enhanced valuation data normalizer for nested API response
 * This file normalizes the valuation data from the nested JSON structure returned by the Auto ISO API
 */

import { extractPrice, extractVehicleDetails } from '@/utils/extraction/pricePathExtractor';
import { ValuationData, TransmissionType } from './valuationDataTypes';

/**
 * Normalize valuation data from the nested API response
 * @param data The API response data
 * @param vin The VIN number
 * @param mileage The vehicle mileage
 * @returns Normalized valuation data
 */
export function normalizeValuationData(data: any, vin?: string, mileage?: number): ValuationData {
  console.log('Normalizing valuation data from nested structure');
  
  try {
    // Extract vehicle details from nested structure
    const vehicleDetails = extractVehicleDetails(data);
    
    // Extract price from nested structure
    const marketValue = extractPrice(data);
    
    if (!marketValue) {
      console.error('Failed to extract price from nested API response');
      return {
        make: '',
        model: '',
        year: 0,
        vin: vin || '',
        transmission: 'manual' as TransmissionType,
        mileage: mileage || 0,
        valuation: 0,
        reservePrice: 0,
        averagePrice: 0,
        basePrice: 0,
        noData: true,
        error: 'No valid price found in response'
      };
    }
    
    // Get average price from nested structure or use market value
    const averagePrice = data?.functionResponse?.valuation?.calcValuation?.price_avr || marketValue;
    
    // Calculate reserve price using the imported function
    let basePrice = marketValue;
    let reservePrice = marketValue;
    
    if (data?.functionResponse?.valuation?.calcValuation) {
      const calcValuation = data.functionResponse.valuation.calcValuation;
      const priceMin = Number(calcValuation.price_min) || 0;
      const priceMed = Number(calcValuation.price_med) || 0;
      
      // Calculate base price as average of min and median (as per business logic)
      if (priceMin > 0 && priceMed > 0) {
        basePrice = (priceMin + priceMed) / 2;
      }
    }
    
    // Construct normalized result
    const result: ValuationData = {
      ...vehicleDetails,
      vin: vin || vehicleDetails.vin,
      mileage: mileage || vehicleDetails.mileage,
      transmission: (vehicleDetails.transmission || 'manual') as TransmissionType,
      valuation: marketValue,
      reservePrice: reservePrice,
      averagePrice: Number(averagePrice),
      basePrice: basePrice,
      noData: false
    };
    
    console.log('Normalized valuation data:', JSON.stringify(result).substring(0, 200) + '...');
    return result;
  } catch (error) {
    console.error('Error normalizing valuation data:', error);
    
    // Return error result with fallback values
    return {
      make: '',
      model: '',
      year: 0,
      vin: vin || '',
      transmission: 'manual' as TransmissionType,
      mileage: mileage || 0,
      valuation: 0,
      reservePrice: 0,
      averagePrice: 0,
      basePrice: 0,
      noData: true,
      error: error.message
    };
  }
}
