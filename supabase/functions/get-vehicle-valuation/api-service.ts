
import { logOperation } from "../_shared/logging.ts";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

/**
 * Fetch valuation data from external API
 * 
 * @param vin Vehicle Identification Number
 * @param mileage Vehicle mileage
 * @param requestId For logging
 * @returns Valuation result
 */
export async function fetchExternalValuation(vin: string, mileage: number, requestId: string): Promise<any> {
  try {
    // Get API credentials from environment variables
    const apiId = Deno.env.get('CAR_API_ID') || 'AUTOSTRA';
    const apiSecret = Deno.env.get('CAR_API_SECRET');
    
    if (!apiSecret) {
      logOperation('api_missing_secret', { requestId }, 'error');
      return {
        success: false,
        error: "Missing API credentials",
        errorCode: "CONFIGURATION_ERROR"
      };
    }
    
    // Calculate checksum
    const input = `${apiId}${apiSecret}${vin}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('MD5', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request_start', { 
      requestId, 
      vin,
      mileage
    });
    
    // Set timeout for API request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      // Make API request
      const response = await fetch(apiUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Autostrada/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
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
          errorCode: "API_ERROR"
        };
      }
      
      const valuationData = await response.json();
      
      logOperation('api_response_success', { 
        requestId, 
        dataSize: JSON.stringify(valuationData).length
      });
      
      // Check if the API returned valid data
      if (!valuationData || Object.keys(valuationData).length < 3) {
        logOperation('api_invalid_data', { 
          requestId, 
          dataFields: Object.keys(valuationData)
        }, 'error');
        
        return {
          success: false,
          error: "Insufficient data returned from valuation API",
          errorCode: "INVALID_RESPONSE"
        };
      }
      
      // Check if the API returned an error
      if (valuationData.error) {
        logOperation('api_business_error', { 
          requestId, 
          error: valuationData.error
        }, 'error');
        
        return {
          success: false,
          error: valuationData.error || "Failed to get valuation",
          errorCode: "BUSINESS_ERROR"
        };
      }
      
      return {
        success: true,
        data: valuationData
      };
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
        error: fetchError.message,
        stack: fetchError.stack
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
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: `General error: ${error.message}`,
      errorCode: "GENERAL_ERROR"
    };
  }
}
