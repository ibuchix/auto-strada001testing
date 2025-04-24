
/**
 * API service utilities for get-vehicle-valuation
 * Updated: 2025-04-29 - Enhanced error handling and logging
 * Updated: 2025-05-15 - Removed all references to caching, ensure direct API calls
 */

import { logOperation } from './logging.ts';
import { calculateMd5 } from './checksum.ts';

export interface ValuationApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  rawResponse?: string;
}

/**
 * Makes a direct call to the valuation API
 */
export async function callValuationApi(
  vin: string,
  mileage: number,
  apiId: string,
  apiSecret: string,
  requestId: string
): Promise<ValuationApiResponse> {
  try {
    // Calculate checksum for API
    const checksumContent = apiId + apiSecret + vin;
    const checksum = await calculateMd5(checksumContent);
    
    logOperation('api_call_details', {
      requestId,
      vin,
      mileage,
      apiId,
      checksumGenerated: true,
      timestamp: new Date().toISOString()
    });
    
    // Build API URL
    const valApiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_call_start', { 
      requestId, 
      timestamp: new Date().toISOString() 
    });
    
    const response = await fetch(valApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    const responseText = await response.text();
    
    logOperation('api_response_received', {
      requestId,
      status: response.status,
      contentType: response.headers.get('content-type'),
      responseSize: responseText.length,
      timestamp: new Date().toISOString()
    });
    
    if (!response.ok) {
      logOperation('api_http_error', { 
        requestId, 
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 300)
      }, 'error');
      
      return {
        success: false,
        error: `HTTP error ${response.status}: ${response.statusText}`,
        rawResponse: responseText
      };
    }
    
    try {
      const jsonData = JSON.parse(responseText);
      
      if (jsonData.error) {
        logOperation('api_json_error', { 
          requestId, 
          error: jsonData.error 
        }, 'error');
        
        return {
          success: false,
          error: jsonData.error,
          data: jsonData,
          rawResponse: responseText
        };
      }
      
      logOperation('api_call_success', { 
        requestId,
        dataSize: responseText.length
      });
      
      return {
        success: true,
        data: jsonData,
        rawResponse: responseText
      };
    } catch (parseError) {
      logOperation('api_json_parse_error', { 
        requestId, 
        error: parseError.message,
        responseText: responseText.substring(0, 300)
      }, 'error');
      
      return {
        success: false,
        error: `Failed to parse API response: ${parseError.message}`,
        rawResponse: responseText
      };
    }
  } catch (error) {
    logOperation('api_call_exception', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: `API call failed: ${error.message}`
    };
  }
}
