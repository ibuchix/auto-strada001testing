
/**
 * Changes made:
 * - 2024-07-22: Extracted external API communication functionality from vin-validation.ts
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
  
  const data = await withRetry(async () => {
    const response = await fetch(valuationUrl);
    if (!response.ok) {
      throw new ValidationError(
        `API responded with status: ${response.status}`, 
        'API_ERROR'
      );
    }
    return await response.json();
  });

  if (!data.success) {
    logOperation('valuation_api_error', { 
      requestId,
      vin, 
      apiResponse: data 
    }, 'error');
    throw new ValidationError(
      data.message || 'Failed to get valuation', 
      'VALUATION_ERROR'
    );
  }
  
  return data;
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
    throw new ValidationError(
      'Failed to calculate reserve price', 
      'RESERVE_PRICE_ERROR'
    );
  }
  
  const reservePrice = reservePriceResult || 0;
  logOperation('calculated_reserve_price', { 
    requestId,
    basePrice, 
    reservePrice 
  });
  
  return reservePrice;
}
