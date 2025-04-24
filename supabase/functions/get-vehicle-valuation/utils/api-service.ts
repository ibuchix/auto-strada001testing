
/**
 * API service utilities for get-vehicle-valuation
 * Updated: 2025-04-29 - Enhanced error handling and logging
 * Updated: 2025-05-15 - Removed all references to caching, ensure direct API calls
 * Updated: 2025-04-24 - Added fallback mechanism for API credentials
 * Updated: 2025-04-24 - Improved raw response handling and data parsing
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
    // Log API credentials status before making the call
    logOperation('api_call_credentials', {
      requestId,
      hasApiId: !!apiId,
      hasApiSecret: !!apiSecret,
      apiIdLength: apiId?.length || 0,
      apiSecretLength: apiSecret?.length || 0,
      usingHardcodedValues: apiId === 'AUTOSTRA' && apiSecret === 'A4FTFH54C3E37P2D34A16A7A4V41XKBF'
    });
    
    // Fallback to hardcoded values if needed
    const effectiveApiId = apiId || 'AUTOSTRA';
    const effectiveApiSecret = apiSecret || 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    
    // Calculate checksum for API
    const checksumContent = effectiveApiId + effectiveApiSecret + vin;
    const checksum = await calculateMd5(checksumContent);
    
    logOperation('api_call_details', {
      requestId,
      vin,
      mileage,
      apiId: effectiveApiId,
      checksumGenerated: true,
      timestamp: new Date().toISOString()
    });
    
    // Build API URL
    const valApiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${effectiveApiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_call_start', { 
      requestId, 
      timestamp: new Date().toISOString() 
    });
    
    const response = await fetch(valApiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'AutostradaAppV1'
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
      // Parse JSON response if possible
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
      
      // Analyze the structure to find where price data might be
      const hasFunctionResponse = !!jsonData.functionResponse;
      const hasCalcValuation = !!jsonData.functionResponse?.valuation?.calcValuation;
      
      logOperation('response_structure_analysis', {
        requestId,
        hasFunctionResponse,
        hasCalcValuation,
        topLevelKeys: Object.keys(jsonData),
        nestedKeys: hasFunctionResponse ? Object.keys(jsonData.functionResponse) : []
      });
      
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
