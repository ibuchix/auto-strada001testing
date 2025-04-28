
/**
 * API service for vehicle valuation
 * Created: 2025-05-05 - Enhanced raw response handling
 * Updated: 2025-05-06 - Added credentials validation
 */

import { logOperation } from "./logging.ts";

/**
 * Validates if the API credentials are properly configured
 */
export function validateApiCredentials(apiId: string | undefined, apiSecret: string | undefined): boolean {
  // Check if API ID is present
  if (!apiId || apiId.trim() === '') {
    console.error('API ID not configured');
    return false;
  }
  
  // Check if API secret is present
  if (!apiSecret || apiSecret.trim() === '') {
    console.error('API secret not configured');
    return false;
  }
  
  // More sophisticated validation could be added here
  return true;
}

export async function callValuationApi(
  vin: string,
  mileage: number,
  apiId: string,
  apiSecret: string,
  requestId: string
): Promise<{
  success: boolean;
  data?: any;
  rawResponse?: string;
  error?: string;
}> {
  try {
    // Validate API credentials first
    if (!validateApiCredentials(apiId, apiSecret)) {
      return {
        success: false,
        error: 'API credentials not properly configured'
      };
    }
    
    // Calculate checksum
    const checksumContent = apiId + apiSecret + vin;
    const checksum = await calculateMd5(checksumContent);
    
    // Build API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request_prepared', {
      requestId,
      url: apiUrl
    });
    
    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      logOperation('api_http_error', {
        requestId,
        status: response.status,
        statusText: response.statusText
      }, 'error');
      
      return {
        success: false,
        error: `API returned status ${response.status}: ${response.statusText}`
      };
    }
    
    // Get the raw response text
    const rawResponseText = await response.text();
    
    // Log response characteristics
    logOperation('api_response_received', {
      requestId,
      responseLength: rawResponseText.length,
      firstChars: rawResponseText.substring(0, 30) + '...'
    });
    
    // Try to parse the response as JSON
    try {
      const jsonData = JSON.parse(rawResponseText);
      
      // Return both the parsed data and the raw response
      return {
        success: true,
        data: jsonData,
        rawResponse: rawResponseText
      };
    } catch (parseError) {
      logOperation('json_parse_error', {
        requestId,
        error: parseError.message,
        rawPreview: rawResponseText.substring(0, 100)
      }, 'error');
      
      // Even if parsing failed, return the raw response
      return {
        success: false,
        error: 'Failed to parse API response as JSON',
        rawResponse: rawResponseText
      };
    }
  } catch (error) {
    logOperation('api_call_error', {
      requestId,
      error: error.message
    }, 'error');
    
    return {
      success: false,
      error: `API call failed: ${error.message}`
    };
  }
}

// Calculate MD5 hash
async function calculateMd5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
