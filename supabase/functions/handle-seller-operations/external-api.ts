
/**
 * Changes made:
 * - 2024-07-22: Extracted external API communication functionality from vin-validation.ts
 * - 2025-12-22: Fixed data transformation and added better error handling
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Database } from '../_shared/database.types.ts';
import { logOperation, ValidationError, withRetry } from './utils.ts';
import { calculateChecksum } from './checksum.ts';

/**
 * Fetches vehicle valuation data from external API
 */
export async function fetchExternalValuation(vin: string, mileage: number, requestId: string) {
  // Get valuation from external API with retry mechanism
  const checksum = await calculateChecksum(vin);
  const valuationUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:AUTOSTRA/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  
  logOperation('fetching_valuation', { 
    requestId,
    vin, 
    url: valuationUrl 
  });
  
  const rawData = await withRetry(async () => {
    const response = await fetch(valuationUrl);
    if (!response.ok) {
      throw new ValidationError(
        `API responded with status: ${response.status}`, 
        'API_ERROR'
      );
    }
    return await response.json();
  });

  if (!rawData) {
    logOperation('valuation_api_empty_response', { 
      requestId,
      vin
    }, 'error');
    throw new ValidationError(
      'Empty response from valuation API', 
      'VALUATION_ERROR'
    );
  }
  
  logOperation('valuation_api_raw_response', { 
    requestId,
    vin, 
    hasResponse: !!rawData,
    responseType: typeof rawData,
    hasFunction: !!rawData.functionResponse
  });
  
  // Extract structured data from API response
  let data: any = {};
  
  try {
    // Check for the various response formats and extract relevant data
    if (rawData.functionResponse?.userParams) {
      // Get vehicle details
      data.make = rawData.functionResponse.userParams.make;
      data.model = rawData.functionResponse.userParams.model;
      data.year = rawData.functionResponse.userParams.year;
      
      // Get pricing data
      if (rawData.functionResponse.valuation?.calcValuation) {
        const calcVal = rawData.functionResponse.valuation.calcValuation;
        data.price = calcVal.price;
        data.price_min = calcVal.price_min;
        data.price_max = calcVal.price_max;
        data.price_avr = calcVal.price_avr;
        data.price_med = calcVal.price_med;
      }
    } else if (rawData.success === false) {
      logOperation('valuation_api_error_response', { 
        requestId,
        vin, 
        apiResponse: rawData 
      }, 'error');
      throw new ValidationError(
        rawData.message || 'Failed to get valuation', 
        'VALUATION_ERROR'
      );
    } else if (typeof rawData === 'string') {
      // Try to parse a string response
      try {
        const parsedData = JSON.parse(rawData);
        if (parsedData.functionResponse) {
          data = fetchExternalValuation(vin, mileage, requestId);
        } else {
          throw new ValidationError('Unexpected string response format', 'PARSING_ERROR');
        }
      } catch (e) {
        throw new ValidationError('Failed to parse API response', 'PARSING_ERROR');
      }
    }
    
    // Validate that we have the essential data
    if (!data.make || !data.model || !data.year) {
      logOperation('valuation_api_missing_vehicle_data', { 
        requestId,
        vin, 
        dataKeys: Object.keys(data)
      }, 'error');
      throw new ValidationError(
        'Missing essential vehicle data in API response', 
        'VALIDATION_ERROR'
      );
    }
    
    return data;
  } catch (error) {
    logOperation('valuation_data_extraction_error', { 
      requestId,
      vin, 
      error: error.message
    }, 'error');
    throw error;
  }
}

/**
 * Calculate reserve price using database function
 */
export async function calculateReservePrice(
  supabase: ReturnType<typeof createClient<Database>>,
  basePrice: number,
  requestId: string
): Promise<number> {
  // Use the database function to calculate reserve price
  const { data: reservePriceResult, error: reservePriceError } = await supabase
    .rpc('calculate_reserve_price', { p_base_price: basePrice });
    
  if (reservePriceError) {
    logOperation('reserve_price_calculation_error', { 
      requestId,
      basePrice, 
      error: reservePriceError.message 
    }, 'error');
    
    // Calculate fallback reserve price using the formula
    let percentage = 0;
    if (basePrice <= 15000) percentage = 0.65;
    else if (basePrice <= 20000) percentage = 0.46;
    else if (basePrice <= 30000) percentage = 0.37;
    else if (basePrice <= 50000) percentage = 0.27;
    else if (basePrice <= 60000) percentage = 0.27;
    else if (basePrice <= 70000) percentage = 0.22;
    else if (basePrice <= 80000) percentage = 0.23;
    else if (basePrice <= 100000) percentage = 0.24;
    else if (basePrice <= 130000) percentage = 0.20;
    else if (basePrice <= 160000) percentage = 0.185;
    else if (basePrice <= 200000) percentage = 0.22;
    else if (basePrice <= 250000) percentage = 0.17;
    else if (basePrice <= 300000) percentage = 0.18;
    else if (basePrice <= 400000) percentage = 0.18;
    else if (basePrice <= 500000) percentage = 0.16;
    else percentage = 0.145; // 500,001+ PLN
    
    const reservePrice = Math.round(basePrice - (basePrice * percentage));
    
    logOperation('calculated_fallback_reserve_price', { 
      requestId,
      basePrice, 
      percentage,
      reservePrice
    });
    
    return reservePrice;
  }
  
  const reservePrice = reservePriceResult || 0;
  logOperation('calculated_reserve_price', { 
    requestId,
    basePrice, 
    reservePrice
  });
  
  return reservePrice;
}
