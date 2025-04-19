
/**
 * External API utilities for seller operations
 * Updated: 2025-04-19 - Now using organized utility structure
 */

import { createSupabaseClient } from "./utils/supabase.ts";
import { logOperation } from "./utils/logging.ts";
import { calculateReservePriceFromTable } from "./utils/reserve-price-calculator.ts";
import { calculateChecksum } from "./utils/checksum.ts";

export interface ValuationResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
}

/**
 * Fetch vehicle valuation from external API
 * @param vin Vehicle Identification Number
 * @param mileage Vehicle mileage
 * @param requestId Unique identifier for request tracking
 */
export async function fetchExternalValuation(
  vin: string,
  mileage: number,
  requestId: string
): Promise<Record<string, any>> {
  logOperation('fetchExternalValuation_start', { requestId, vin, mileage });
  
  try {
    // API credentials from environment variables
    const apiId = Deno.env.get('VALUATION_API_ID') || 'AUTOSTRA';
    const apiKey = Deno.env.get('VALUATION_API_KEY') || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    // Calculate checksum
    const checksum = await calculateChecksum(apiId, apiKey, vin);
    
    // Construct API URL
    const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    // Make API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Unknown API error');
    }
    
    logOperation('fetchExternalValuation_success', { 
      requestId, 
      vin,
      responseStatus: response.status,
      dataReceived: !!data
    });
    
    return data.data || {};
  } catch (error) {
    logOperation('fetchExternalValuation_error', { 
      requestId, 
      vin,
      error: error.message 
    }, 'error');
    
    throw error;
  }
}

/**
 * Calculate reserve price based on base price
 * @param supabase Supabase client
 * @param basePrice Base price for calculation
 * @param requestId Unique identifier for request tracking
 */
export async function calculateReservePrice(
  supabase: ReturnType<typeof createSupabaseClient>,
  basePrice: number,
  requestId: string
): Promise<number> {
  logOperation('calculateReservePrice_start', { requestId, basePrice });
  
  try {
    // Use the dedicated calculator
    const reservePrice = calculateReservePriceFromTable(basePrice);
    
    logOperation('calculateReservePrice_success', { 
      requestId, 
      basePrice,
      reservePrice
    });
    
    return reservePrice;
  } catch (error) {
    logOperation('calculateReservePrice_error', { 
      requestId, 
      basePrice,
      error: error.message 
    }, 'error');
    
    // Default to 70% if calculation fails
    return Math.round(basePrice * 0.7);
  }
}
