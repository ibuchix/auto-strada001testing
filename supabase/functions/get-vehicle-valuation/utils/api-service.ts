
/**
 * API service utilities for get-vehicle-valuation
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { logOperation } from './logging.ts';
import { crypto } from "https://deno.land/std@0.217.0/crypto/mod.ts";

/**
 * Generate MD5 hash
 * @param message String to hash
 * @returns MD5 hash as hexadecimal string
 */
export function md5(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = crypto.subtle.digestSync("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate valuation checksum for API authentication
 * @param apiId API ID for valuation service
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns Checksum string
 */
export function calculateValuationChecksum(apiId: string, apiSecret: string, vin: string): string {
  const checksumContent = apiId + apiSecret + vin;
  return md5(checksumContent);
}

/**
 * Call external valuation API
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param requestId For logging
 * @returns Response from API
 */
export async function callValuationApi(vin: string, mileage: number, requestId: string): Promise<any> {
  try {
    // Get API credentials
    const apiId = Deno.env.get("VALUATION_API_ID") || "AUTOSTRA";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET");
    
    if (!apiSecret) {
      logOperation('missing_api_credentials', { requestId }, 'error');
      return {
        success: false,
        error: "API credentials not configured",
        errorCode: "CONFIGURATION_ERROR"
      };
    }

    // Generate checksum for API auth
    const checksum = calculateValuationChecksum(apiId, apiSecret, vin);
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;

    logOperation('calling_external_api', {
      requestId,
      vin,
      mileage,
      url: apiUrl
    });

    // Set timeout for API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Autostrada/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        logOperation('api_error_response', { 
          requestId,
          status: response.status,
          statusText: response.statusText
        }, 'error');
        
        return {
          success: false,
          error: `API Error: ${response.status} ${response.statusText}`,
          errorCode: "API_ERROR"
        };
      }

      // Log raw API response
      const rawData = await response.text();
      logOperation('raw_api_response_received', {
        requestId,
        responseSize: rawData.length,
        timestamp: new Date().toISOString()
      });

      try {
        return {
          success: true,
          data: JSON.parse(rawData)
        };
      } catch (parseError) {
        logOperation('parse_error', {
          requestId,
          error: parseError.message,
          rawData: rawData.substring(0, 500)
        }, 'error');
        
        return {
          success: false,
          error: "Failed to parse API response",
          errorCode: "PARSE_ERROR"
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logOperation('api_timeout', { requestId }, 'error');
        return {
          success: false,
          error: "Valuation API request timed out",
          errorCode: "TIMEOUT"
        };
      }
      
      logOperation('api_fetch_error', { 
        requestId, 
        error: fetchError.message
      }, 'error');
      
      return {
        success: false,
        error: `API fetch error: ${fetchError.message}`,
        errorCode: "NETWORK_ERROR"
      };
    }
  } catch (error) {
    logOperation('api_general_error', { 
      requestId, 
      error: error.message
    }, 'error');
    
    return {
      success: false,
      error: `General error: ${error.message}`,
      errorCode: "GENERAL_ERROR"
    };
  }
}
