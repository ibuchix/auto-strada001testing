
/**
 * Checksum calculation utilities for handle-seller-operations
 * Created: 2025-04-19 - Moved from root directory to utils
 */

import { logOperation } from './logging.ts';

/**
 * Calculate MD5 hash
 * @param data String data to hash
 * @returns MD5 hash string
 */
export async function calculateMd5(data: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Calculate hash
  const hashBuffer = await crypto.subtle.digest('MD5', dataBuffer);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Calculate valuation API checksum
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns Checksum string
 */
export async function calculateChecksum(
  apiId: string,
  apiSecret: string,
  vin: string
): Promise<string> {
  try {
    const inputString = `${apiId}${apiSecret}${vin}`;
    return await calculateMd5(inputString);
  } catch (error) {
    logOperation('checksum_error', { 
      error: error.message,
      stack: error.stack
    }, 'error');
    throw new Error(`Failed to calculate checksum: ${error.message}`);
  }
}

/**
 * Verify API checksum
 * @param providedChecksum Checksum to verify
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns Boolean indicating if checksums match
 */
export async function verifyChecksum(
  providedChecksum: string,
  apiId: string,
  apiSecret: string,
  vin: string
): Promise<boolean> {
  const calculatedChecksum = await calculateChecksum(apiId, apiSecret, vin);
  return calculatedChecksum.toLowerCase() === providedChecksum.toLowerCase();
}
