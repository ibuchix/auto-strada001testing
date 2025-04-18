
/**
 * External API utilities for seller operations
 * Created: 2025-04-19 - Extracted from shared module
 */

import { createClient } from "./utils.ts";
import { logOperation } from "./logging.ts";
import { calculateReservePriceFromTable } from "./reserve-price-calculator.ts";

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
 * Calculate checksum for API request
 * @param apiId API identifier
 * @param apiKey API secret key
 * @param vin Vehicle Identification Number
 */
async function calculateChecksum(apiId: string, apiKey: string, vin: string): Promise<string> {
  const input = `${apiId}${apiKey}${vin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  
  // Use crypto API to calculate MD5 hash
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Calculate reserve price based on base price
 * @param supabase Supabase client
 * @param basePrice Base price for calculation
 * @param requestId Unique identifier for request tracking
 */
export async function calculateReservePrice(
  supabase: ReturnType<typeof createClient>,
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
