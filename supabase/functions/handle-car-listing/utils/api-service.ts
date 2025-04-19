
/**
 * API service utilities for handle-car-listing
 * Created: 2025-04-19 - Extracted from inline implementation
 */

import { calculateChecksum } from './checksum.ts';
import { logOperation } from './logging.ts';

/**
 * Call the vehicle valuation API
 * @param vin Vehicle identification number
 * @param mileage Vehicle mileage
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param requestId Request identifier for tracking
 * @returns API response data
 */
export async function callValuationApi(
  vin: string, 
  mileage: number, 
  apiId: string, 
  apiSecret: string,
  requestId: string
): Promise<any> {
  // Calculate checksum
  const checksum = await calculateChecksum(apiId, apiSecret, vin);
  logOperation('checksum_calculated', { requestId, vin }, 'debug');
  
  // Construct API URL
  const apiUrl = `https://bp.autoiso.pl/api/v3/getVinValuation/apiuid:${apiId}/checksum:${checksum}/vin:${vin}/odometer:${mileage}/currency:PLN`;
  logOperation('calling_api', { requestId, url: apiUrl }, 'debug');
  
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
      logOperation('api_error', { 
        requestId, 
        status: response.status, 
        statusText: response.statusText 
      }, 'error');
      
      const responseText = await response.text();
      throw new Error(`API responded with status: ${response.status} - ${responseText}`);
    }
    
    const data = await response.json();
    logOperation('api_success', { requestId, dataSize: JSON.stringify(data).length }, 'debug');
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      logOperation('api_timeout', { requestId }, 'error');
      throw new Error('Valuation API request timed out');
    }
    
    throw error;
  }
}
