
/**
 * Shared checksum utility
 * Created: 2025-04-19
 */

import { logOperation } from './logging.ts';

/**
 * Calculate MD5 hash
 * @param data String to hash
 * @returns MD5 hash string
 */
export async function calculateMd5(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  const hashBuffer = await crypto.subtle.digest('MD5', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Calculate valuation API checksum
 * @param apiId API identifier
 * @param apiSecret API secret key
 * @param vin Vehicle identification number
 * @returns Calculated checksum
 */
export async function calculateValuationChecksum(
  apiId: string,
  apiSecret: string,
  vin: string
): Promise<string> {
  try {
    const inputString = apiId + apiSecret + vin;
    return await calculateMd5(inputString);
  } catch (error) {
    logOperation('checksum_calculation_error', { 
      error: error instanceof Error ? error.message : String(error)
    }, 'error');
    throw new Error(`Checksum calculation failed: ${error}`);
  }
}
