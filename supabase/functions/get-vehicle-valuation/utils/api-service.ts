
/**
 * API service functions for vehicle valuation
 * Updated: 2025-04-29 - ENHANCED LOGGING FOR DEBUGGING
 * Updated: 2025-05-01 - Added raw response preservation
 */
import { logOperation } from "./logging.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

/**
 * Call the external valuation API
 */
export async function callValuationApi(vin: string, mileage: number, requestId: string) {
  try {
    // Get API credentials (first try valuation-specific env vars, then fall back to generic)
    const apiId = Deno.env.get("VALUATION_API_ID") || "AUTOSTRA";
    const apiSecret = Deno.env.get("VALUATION_API_SECRET") || Deno.env.get("CAR_API_SECRET");
    
    // Detailed logging of credentials (safely)
    logOperation('api_credentials_check', {
      requestId,
      usingApiId: apiId,
      hasApiSecret: !!apiSecret,
      apiSecretLength: apiSecret ? apiSecret.length : 0,
      apiSecretFirstChars: apiSecret ? apiSecret.substring(0, 4) + '***' : 'MISSING',
      apiSecretLastChars: apiSecret ? '***' + apiSecret.substring(apiSecret.length - 4) : 'MISSING',
      timestamp: new Date().toISOString()
    });
    
    if (!apiSecret) {
      logOperation('missing_api_secret', { requestId }, 'error');
      return {
        success: false,
        error: "Missing API secret key",
        rawResponse: null
      };
    }
    
    // Calculate checksum (md5 hash of apiId + apiSecret + vin)
    const input = `${apiId}${apiSecret}${vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Log the input for checksum (without exposing the full API secret)
    logOperation('checksum_calculation', {
      requestId,
      apiId,
      vinUsed: vin,
      checksumGenerated: checksum,
      inputLength: input.length,
      timestamp: new Date().toISOString()
    });
    
    // Construct the API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request_url', {
      requestId,
      url: apiUrl.replace(checksum, 'CHECKSUM-HIDDEN-FOR-SECURITY'),
      timestamp: new Date().toISOString()
    });
    
    // Set timeout for API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Make the actual API request
      logOperation('api_request_start', { requestId, vin, mileage });
      
      const response = await fetch(apiUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Autostrada/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Log the response status
      logOperation('api_response_received', {
        requestId,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers.entries()]),
        timestamp: new Date().toISOString()
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        logOperation('api_response_error', { 
          requestId, 
          status: response.status,
          statusText: response.statusText,
          responseText
        }, 'error');
        
        return {
          success: false,
          error: `API responded with status: ${response.status}`,
          rawResponse: responseText
        };
      }
      
      // Parse the response
      const responseText = await response.text();
      logOperation('api_response_text', {
        requestId,
        responseTextLength: responseText.length,  // Don't log the whole text to avoid overwhelming logs
        timestamp: new Date().toISOString()
      });
      
      // Store the raw response text for debugging
      const rawResponse = responseText;
      
      let valuationData;
      try {
        valuationData = JSON.parse(responseText);
        
        // Log the parsed data structure
        logOperation('api_response_parsed', {
          requestId,
          hasData: !!valuationData,
          topLevelKeys: Object.keys(valuationData),
          dataSize: JSON.stringify(valuationData).length,
          timestamp: new Date().toISOString()
        });
        
        // Deep check for important fields
        logOperation('api_response_fields', {
          requestId,
          hasMake: !!valuationData.make,
          hasModel: !!valuationData.model,
          hasYear: !!valuationData.year,
          hasValuation: !!valuationData.valuation,
          hasPriceMin: !!valuationData.price_min,
          hasPriceMed: !!valuationData.price_med,
          hasCalcValuation: !!valuationData.functionResponse?.valuation?.calcValuation,
          timestamp: new Date().toISOString()
        });
        
      } catch (parseError) {
        logOperation('api_response_parse_error', { 
          requestId, 
          error: parseError.message,
          responseText
        }, 'error');
        
        return {
          success: false,
          error: `Failed to parse API response: ${parseError.message}`,
          rawResponse
        };
      }
      
      // Check for error in the API response
      if (valuationData.error) {
        logOperation('api_business_error', { 
          requestId, 
          error: valuationData.error
        }, 'error');
        
        return {
          success: false,
          error: valuationData.error,
          rawResponse
        };
      }
      
      // Log the successful result
      logOperation('api_call_success', {
        requestId,
        dataSize: JSON.stringify(valuationData).length,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        data: valuationData,
        rawResponse
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        logOperation('api_timeout', { requestId }, 'error');
        return {
          success: false,
          error: "API request timed out",
          rawResponse: null
        };
      }
      
      logOperation('api_fetch_error', {
        requestId,
        error: fetchError.message,
        stack: fetchError.stack,
        timestamp: new Date().toISOString()
      }, 'error');
      
      return {
        success: false,
        error: `Fetch error: ${fetchError.message}`,
        rawResponse: null
      };
    }
  } catch (error) {
    logOperation('api_service_error', {
      requestId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, 'error');
    
    return {
      success: false,
      error: `Error in API service: ${error.message}`,
      rawResponse: null
    };
  }
}
