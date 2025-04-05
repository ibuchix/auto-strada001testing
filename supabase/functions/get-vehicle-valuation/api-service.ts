
/**
 * API service for vehicle valuations
 * Handles all external API communication
 */

import { logOperation } from "../_shared/logging.ts";
import { generateChecksum } from "../_shared/checksum.ts";

// Define API constants
const API_ID = Deno.env.get("CAR_API_ID") || "AUTOSTRA";
const API_SECRET = Deno.env.get("CAR_API_SECRET") || "";

/**
 * Fetches valuation data from the external API
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param requestId Request ID for logging
 * @returns Object with success flag and data or error message
 */
export async function fetchExternalValuation(vin: string, mileage: number, requestId: string) {
  try {
    // Generate checksum for API authentication
    const checksum = generateChecksum(API_ID, API_SECRET, vin);
    
    // Construct API URL
    const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${API_ID}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
    
    logOperation('api_request', { 
      requestId,
      url: apiUrl
    });
    
    // Call external API with retry
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      logOperation('api_error', { 
        requestId, 
        status: response.status,
        error: errorText
      }, 'error');
      
      return {
        success: false,
        error: `API returned error status: ${response.status}`,
        errorCode: "API_ERROR",
        details: errorText
      };
    }
    
    const apiData = await response.json();
    
    logOperation('api_success', { 
      requestId, 
      responseSize: JSON.stringify(apiData).length
    });
    
    // Extract and validate the essential data
    if (!apiData.make || !apiData.model) {
      return {
        success: false,
        error: "Missing essential vehicle data in API response",
        errorCode: "VALIDATION_ERROR"
      };
    }
    
    return {
      success: true,
      data: apiData
    };
    
  } catch (error) {
    logOperation('api_exception', { 
      requestId, 
      error: error.message,
      stack: error.stack
    }, 'error');
    
    return {
      success: false,
      error: "Failed to get valuation: " + error.message,
      errorCode: "API_EXCEPTION"
    };
  }
}
