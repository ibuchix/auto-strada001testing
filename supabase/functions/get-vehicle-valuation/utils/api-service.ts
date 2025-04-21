
/**
 * API Service for get-vehicle-valuation
 * Created: 2025-04-19
 * Updated: 2025-04-28 - Enhanced error handling and detailed logging
 */

import { logOperation } from "./logging.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";
import { encodeToString } from "https://deno.land/std@0.177.0/encoding/hex.ts";

/**
 * Call the Auto ISO valuation API
 */
export async function callValuationApi(vin: string, mileage: number, requestId: string) {
  try {
    // Get API credentials from environment variables
    const apiId = Deno.env.get("VALUATION_API_ID") || "AUTOSTRA";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || Deno.env.get("CAR_API_SECRET");
    
    // Log API credentials status (without revealing the actual secret)
    logOperation('api_credentials', {
      requestId,
      hasApiId: !!apiId,
      hasApiSecret: !!apiSecret,
      apiIdValue: apiId,
      apiSecretLength: apiSecret ? apiSecret.length : 0,
      timestamp: new Date().toISOString()
    });
    
    if (!apiSecret) {
      logOperation('missing_api_secret', { requestId }, 'error');
      return {
        success: false,
        error: 'API secret is not configured'
      };
    }
    
    // Calculate checksum: md5(api id + api secret key + vin)
    const checksum = await calculateChecksum(apiId, apiSecret, vin, requestId);
    
    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('calling_api', {
      requestId,
      apiUrl,
      vin,
      mileage
    });
    
    // Set reasonable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      // Make the API request
      const startTime = performance.now();
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AutostradaValuationService/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      const endTime = performance.now();
      
      logOperation('api_response_timing', {
        requestId,
        timeMs: (endTime - startTime).toFixed(2),
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });
      
      // Check if the response is successful
      if (!response.ok) {
        const errorText = await response.text();
        logOperation('api_http_error', {
          requestId,
          status: response.status,
          statusText: response.statusText,
          errorText
        }, 'error');
        
        return {
          success: false,
          error: `API responded with error: ${response.status} ${response.statusText}`,
          data: { errorText }
        };
      }
      
      // Parse the JSON response
      // First log the raw text for debugging
      const responseText = await response.text();
      logOperation('api_response_raw', {
        requestId,
        responseLength: responseText.length,
        timestamp: new Date().toISOString()
      });
      
      let jsonData;
      try {
        jsonData = JSON.parse(responseText);
        
        // Log the parsed JSON structure
        logOperation('api_response_parsed', {
          requestId,
          hasData: !!jsonData,
          keys: Object.keys(jsonData),
          nestedKeys: jsonData?.functionResponse ? Object.keys(jsonData.functionResponse) : []
        });
        
        return {
          success: true,
          data: jsonData
        };
      } catch (parseError) {
        logOperation('api_json_parse_error', {
          requestId,
          error: parseError.message,
          responseText: responseText.substring(0, 200) + '...',
          responseLength: responseText.length
        }, 'error');
        
        return {
          success: false,
          error: 'Failed to parse API response',
          data: { responseText }
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Check if this is a timeout error
      if (fetchError.name === 'AbortError') {
        logOperation('api_timeout', { requestId }, 'error');
        return {
          success: false,
          error: 'API request timed out after 15 seconds'
        };
      }
      
      logOperation('api_fetch_error', {
        requestId,
        error: fetchError.message,
        name: fetchError.name,
        stack: fetchError.stack
      }, 'error');
      
      return {
        success: false,
        error: `Fetch error: ${fetchError.message}`
      };
    }
  } catch (error) {
    logOperation('api_service_error', {
      requestId,
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: `Error calling valuation API: ${error.message}`
    };
  }
}

/**
 * Calculate MD5 checksum for API authentication
 */
async function calculateChecksum(apiId: string, apiSecret: string, vin: string, requestId: string) {
  try {
    // Input is the concatenation of API ID + API secret + VIN
    const input = `${apiId}${apiSecret}${vin}`;
    
    // Encode the input to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    // Calculate MD5 hash
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    // Convert to hex string
    const checksum = encodeToString(hashArray);
    
    logOperation('checksum_calculated', {
      requestId,
      checksumLength: checksum.length,
      inputLength: input.length,
      // Log a small part of the checksum for verification
      checksumStart: checksum.substring(0, 8),
      checksumEnd: checksum.substring(checksum.length - 8)
    });
    
    return checksum;
  } catch (error) {
    logOperation('checksum_error', {
      requestId,
      error: error.message
    }, 'error');
    
    throw new Error(`Failed to calculate checksum: ${error.message}`);
  }
}
