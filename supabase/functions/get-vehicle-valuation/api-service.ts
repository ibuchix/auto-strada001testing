
/**
 * Service for interacting with the external valuation API
 * 
 * Changes:
 * - Fixed import path to use correct relative path format for Deno
 */
import { generateChecksum } from "../_shared/checksum.ts";
import { logOperation } from "../_shared/logging.ts";

/**
 * Fetch valuation data from the external API
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param requestId Request ID for tracking
 * @returns Valuation result
 */
export async function fetchExternalValuation(vin: string, mileage: number, requestId: string): Promise<any> {
  try {
    const apiId = 'AUTOSTRA';
    const apiSecret = 'A4FTFH54C3E37P2D34A16A7A4V41XKBF';
    const checksum = generateChecksum(apiId, apiSecret, vin);
    
    // Log request details
    logOperation('api_request', { 
      requestId, 
      vin, 
      mileage, 
      apiId 
    });
    
    // Construct API URL
    const url = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    // Set timeout of 15 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    // Fetch data from API
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Handle response
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check if API returned an error
    if (data.error) {
      return {
        success: false,
        error: data.error,
        errorCode: data.errorCode || 'API_ERROR'
      };
    }
    
    // Log success
    logOperation('api_success', { 
      requestId, 
      dataSize: JSON.stringify(data).length 
    });
    
    return {
      success: true,
      data
    };
  } catch (err) {
    // Log error
    logOperation('api_error', { 
      requestId, 
      error: err.message,
      stack: err.stack
    }, 'error');
    
    return {
      success: false,
      error: err.message,
      errorCode: err.name === 'AbortError' ? 'TIMEOUT' : 'API_ERROR'
    };
  }
}
