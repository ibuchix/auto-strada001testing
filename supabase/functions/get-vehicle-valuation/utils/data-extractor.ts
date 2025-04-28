
/**
 * Data extraction utilities for nested API responses
 * Created: 2025-04-28 - Added comprehensive data extraction
 */

import { logOperation } from './logging.ts';

export interface VehicleDetails {
  make: string;
  model: string;
  year: number;
  fuel?: string;
  capacity?: string;
}

export interface PriceData {
  price?: number;
  price_min?: number;
  price_max?: number;
  price_avr?: number;
  price_med?: number;
}

/**
 * Extract vehicle details from the nested API response
 * @param data The API response data
 * @returns The extracted vehicle details
 */
export function extractVehicleDetails(data: any): VehicleDetails {
  try {
    // Check for nested structure in functionResponse
    if (data?.functionResponse?.userParams) {
      return {
        make: data.functionResponse.userParams.make || '',
        model: data.functionResponse.userParams.model || '',
        year: Number(data.functionResponse.userParams.year) || 0,
        fuel: data.functionResponse.userParams.fuel || '',
        capacity: data.functionResponse.userParams.capacity || ''
      };
    }
    
    // Check for nested structure in valuation
    if (data?.functionResponse?.valuation?.calcValuation?.make) {
      const calcVal = data.functionResponse.valuation.calcValuation;
      return {
        make: calcVal.make || '',
        model: calcVal.model || '',
        year: Number(calcVal.year) || 0,
        fuel: calcVal.fuel || '',
        capacity: calcVal.capacity || ''
      };
    }
    
    // Fallback to direct fields
    return {
      make: data.make || '',
      model: data.model || '',
      year: Number(data.year) || 0
    };
  } catch (error) {
    logOperation('vehicle_details_extraction_error', {
      error: error instanceof Error ? error.message : String(error)
    }, 'error');
    
    return {
      make: '',
      model: '',
      year: 0
    };
  }
}

/**
 * Extract nested price data from API response
 * @param data The API response data 
 * @returns An object containing all available price data
 */
export function extractNestedPriceData(data: any): PriceData {
  const result: PriceData = {};
  
  try {
    // Check for nested structure in functionResponse
    if (data?.functionResponse?.valuation?.calcValuation) {
      const calcValuation = data.functionResponse.valuation.calcValuation;
      
      if (typeof calcValuation.price !== 'undefined') result.price = Number(calcValuation.price);
      if (typeof calcValuation.price_min !== 'undefined') result.price_min = Number(calcValuation.price_min);
      if (typeof calcValuation.price_max !== 'undefined') result.price_max = Number(calcValuation.price_max);
      if (typeof calcValuation.price_avr !== 'undefined') result.price_avr = Number(calcValuation.price_avr);
      if (typeof calcValuation.price_med !== 'undefined') result.price_med = Number(calcValuation.price_med);
      
      if (Object.keys(result).length > 0) {
        logOperation('extracted_nested_price_data', { 
          source: 'calcValuation',
          fields: Object.keys(result)
        });
        return result;
      }
    }
    
    // Direct access for pre-processed data
    if (typeof data?.price !== 'undefined') result.price = Number(data.price);
    if (typeof data?.price_min !== 'undefined') result.price_min = Number(data.price_min);
    if (typeof data?.price_max !== 'undefined') result.price_max = Number(data.price_max);
    if (typeof data?.price_avr !== 'undefined') result.price_avr = Number(data.price_avr); 
    if (typeof data?.price_med !== 'undefined') result.price_med = Number(data.price_med);
    
    if (Object.keys(result).length > 0) {
      logOperation('extracted_direct_price_data', {
        fields: Object.keys(result)
      });
    } else {
      logOperation('no_price_data_found', {}, 'warn');
    }
    
    return result;
  } catch (error) {
    logOperation('price_data_extraction_error', {
      error: error instanceof Error ? error.message : String(error)
    }, 'error');
    return result;
  }
}

/**
 * Calculate base price from nested price data
 * Uses the official formula: (price_min + price_med) / 2
 * @param priceData The price data object
 * @returns The calculated base price or 0 if no valid data
 */
export function calculateBasePriceFromNested(priceData: PriceData): number {
  try {
    // If we have both price_min and price_med, use the official formula
    if (typeof priceData.price_min === 'number' && 
        typeof priceData.price_med === 'number' &&
        !isNaN(priceData.price_min) && 
        !isNaN(priceData.price_med) &&
        priceData.price_min > 0 &&
        priceData.price_med > 0) {
      
      const basePrice = (priceData.price_min + priceData.price_med) / 2;
      logOperation('calculated_base_price', {
        method: 'min_med_formula',
        price_min: priceData.price_min,
        price_med: priceData.price_med,
        basePrice
      });
      return basePrice;
    }
    
    // If we have just the price, use that
    if (typeof priceData.price === 'number' && !isNaN(priceData.price) && priceData.price > 0) {
      logOperation('calculated_base_price', {
        method: 'direct_price',
        price: priceData.price
      });
      return priceData.price;
    }
    
    // If we have just the median price, use that
    if (typeof priceData.price_med === 'number' && !isNaN(priceData.price_med) && priceData.price_med > 0) {
      logOperation('calculated_base_price', {
        method: 'median_price',
        price_med: priceData.price_med
      });
      return priceData.price_med;
    }
    
    // If we have just the average price, use that
    if (typeof priceData.price_avr === 'number' && !isNaN(priceData.price_avr) && priceData.price_avr > 0) {
      logOperation('calculated_base_price', {
        method: 'average_price',
        price_avr: priceData.price_avr
      });
      return priceData.price_avr;
    }
    
    // If we have just the min price, use that
    if (typeof priceData.price_min === 'number' && !isNaN(priceData.price_min) && priceData.price_min > 0) {
      logOperation('calculated_base_price', {
        method: 'min_price',
        price_min: priceData.price_min
      });
      return priceData.price_min;
    }
    
    // If we have just the max price, use that
    if (typeof priceData.price_max === 'number' && !isNaN(priceData.price_max) && priceData.price_max > 0) {
      logOperation('calculated_base_price', {
        method: 'max_price',
        price_max: priceData.price_max
      });
      return priceData.price_max;
    }
    
    // No valid price found
    logOperation('no_valid_price_data', {}, 'error');
    return 0;
  } catch (error) {
    logOperation('base_price_calculation_error', {
      error: error instanceof Error ? error.message : String(error)
    }, 'error');
    return 0;
  }
}
